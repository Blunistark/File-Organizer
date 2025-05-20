import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography, Box, Chip, TextField } from '@mui/material';

const MCP_API = 'http://localhost:8001/api';

interface FileItem {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  id?: string;
  folderId?: string | null;
}

interface FolderOrganizationSuggestionProps {
  files: FileItem[];
  open: boolean;
  onClose: () => void;
  existingFolders: string[];
  existingTags: string[];
}

const FolderOrganizationSuggestion: React.FC<FolderOrganizationSuggestionProps> = ({ files, open, onClose, existingFolders, existingTags }) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      const file_prompts = files.map(f => f.originalName || f.filename);
      const res = await fetch(`${MCP_API}/organize/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_prompts,
          user_context: {},
          allowed_tags: [],
          existing_folders: existingFolders,
          existing_tags: existingTags,
        }),
      });
      if (!res.ok) throw new Error('Failed to get folder suggestion');
      const data = await res.json();
      setResult(data);
      setEditName(data.folderName);
      setEditTags(data.tags);
    } catch (e: any) {
      setError(e.message || 'Error fetching folder suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!files.length) return;
    let folderId = files[0].folderId;
    let folderPath = files[0].path.replace(/[^/]+$/, result.folderName);
    try {
      // If no folderId, create the folder first
      if (!folderId) {
        const createRes = await fetch('http://localhost:5000/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: result.folderName, path: folderPath }),
        });
        if (!createRes.ok) throw new Error('Failed to create folder');
        const folderData = await createRes.json();
        folderId = folderData.data.id;
      } else {
        // Rename folder if it exists
        await fetch(`http://localhost:5000/api/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: result.folderName,
            path: folderPath,
          }),
        });
      }
      // Apply tags and update folderId for all files
      await Promise.all(
        files.map(file =>
          fetch(`http://localhost:5000/api/files/${file.id || file.filename}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: result.tags, folderId }),
          })
        )
      );
      alert('Folder created/renamed and tags applied!');
    } catch (e) {
      alert('Error updating or creating folder or files.');
    }
  };

  const handleEditSave = async () => {
    if (!files.length) return;
    let folderId = files[0].folderId;
    let folderPath = files[0].path.replace(/[^/]+$/, editName);
    try {
      // If no folderId, create the folder first
      if (!folderId) {
        const createRes = await fetch('http://localhost:5000/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editName, path: folderPath }),
        });
        if (!createRes.ok) throw new Error('Failed to create folder');
        const folderData = await createRes.json();
        folderId = folderData.data.id;
      } else {
        // Rename folder if it exists
        await fetch(`http://localhost:5000/api/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName,
            path: folderPath,
          }),
        });
      }
      // Apply tags and update folderId for all files
      await Promise.all(
        files.map(file =>
          fetch(`http://localhost:5000/api/files/${file.id || file.filename}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags: editTags, folderId }),
          })
        )
      );
      setShowEdit(false);
      alert('Folder created/renamed and tags applied!');
    } catch (e) {
      alert('Error updating or creating folder or files.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Folder Organization Suggestion</DialogTitle>
      <DialogContent>
        <Button onClick={handleSuggest} disabled={loading} sx={{ mb: 2 }}>
          {loading ? <CircularProgress size={20} /> : 'Get Suggestion'}
        </Button>
        {error && <Typography color="error">{error}</Typography>}
        {result && (
          <Box>
            <Typography variant="subtitle1">Suggested Folder Name: {result.folderName}</Typography>
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Tags:</Typography>
              {result.tags.map((tag: string) => (
                <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
              ))}
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}><b>Summary:</b> {result.summary}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}><b>Reasoning:</b> {result.reasoning}</Typography>
            {result.alternatives && result.alternatives.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2"><b>Alternatives:</b></Typography>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {result.alternatives.map((alt: any, i: number) => (
                    <li key={i}>
                      <b>{alt.folderName}</b>
                      {alt.tags && alt.tags.length > 0 && (
                        <>
                          {' — '}
                          {alt.tags.map((tag: string, j: number) => (
                            <Chip key={j} label={tag} size="small" sx={{ mr: 0.5 }} />
                          ))}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" size="small" onClick={handleAccept} sx={{ mr: 1 }}>Accept</Button>
              <Button variant="outlined" size="small" onClick={() => setShowEdit(true)} sx={{ mr: 1 }}>Modify</Button>
            </Box>
          </Box>
        )}
        <Dialog open={showEdit} onClose={() => setShowEdit(false)}>
          <DialogTitle>Modify Folder Suggestion</DialogTitle>
          <DialogContent>
            <TextField
              label="Folder Name"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Tags (comma separated)"
              value={editTags.join(', ')}
              onChange={e => setEditTags(e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEditSave} variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolderOrganizationSuggestion; 