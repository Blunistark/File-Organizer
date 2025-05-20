import React, { useState } from 'react';
import { Card, Button, Typography, Chip, CircularProgress, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';

interface FileItem {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  id?: string;
  folderId?: string | null;
}

interface Suggestion {
  suggestedPath: string;
  tags: string[];
  tagConfidences: Record<string, number>;
  summary: string;
  confidence: number;
  reasoning: string;
  alternatives?: string[];
}

interface OrganizationSuggestionProps {
  file: FileItem;
  initialSuggestion?: Suggestion;
}

const MCP_API = 'http://localhost:8001/api'; // Adjust if needed
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/files';

const OrganizationSuggestion: React.FC<OrganizationSuggestionProps> = ({ file, initialSuggestion }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(initialSuggestion || null);
  const [showEdit, setShowEdit] = useState(false);
  const [editPath, setEditPath] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      // Fetch file content (for demo, just use filename as content)
      let content = file.originalName || file.filename;
      // In real app, fetch actual file content here
      const analyzeRes = await fetch(`${MCP_API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const { prompt } = await analyzeRes.json();
      const organizeRes = await fetch(`${MCP_API}/organize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          file_type: file.mimeType?.includes('pdf') ? 'pdf' : file.mimeType?.includes('image') ? 'image' : 'text',
          user_context: {},
          allowed_tags: [],
        }),
      });
      if (!organizeRes.ok) throw new Error('Failed to get suggestion');
      const data = await organizeRes.json();
      setSuggestion(data);
    } catch (e: any) {
      setError(e.message || 'Error fetching suggestion');
    } finally {
      setLoading(false);
    }
  };

  const updateFileOrganization = async (path: string, tags: string[]) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const fileId = file.id || file.filename;
      const res = await fetch(`${API_URL}/${fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: path, tags }),
      });
      if (!res.ok) throw new Error('Failed to update file organization');
      setSuccess('File organization updated!');
    } catch (e: any) {
      setError(e.message || 'Error updating file organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!suggestion) return;
    updateFileOrganization(suggestion.suggestedPath, suggestion.tags);
  };
  const handleModify = () => {
    setEditPath(suggestion?.suggestedPath || '');
    setEditTags(suggestion?.tags || []);
    setShowEdit(true);
  };
  const handleSkip = () => {
    setSuggestion(null);
  };
  const handleEditSave = () => {
    setShowEdit(false);
    updateFileOrganization(editPath, editTags);
  };

  return (
    <Box sx={{ my: 2 }}>
      {!suggestion && !loading && (
        <Button variant="outlined" onClick={fetchSuggestion} size="small">
          Get Organization Suggestion
        </Button>
      )}
      {loading && <CircularProgress size={24} />}
      {error && <Typography color="error">{error}</Typography>}
      {success && <Typography color="success.main">{success}</Typography>}
      {suggestion && (
        <Card sx={{ p: 2, mt: 1 }}>
          <Typography variant="subtitle1">Suggested Path: {suggestion.suggestedPath}</Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Tags:</Typography>
            {suggestion.tags.map(tag => (
              <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}><b>Summary:</b> {suggestion.summary}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}><b>Confidence:</b> {(suggestion.confidence * 100).toFixed(1)}%</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}><b>Reasoning:</b> {suggestion.reasoning}</Typography>
          {suggestion.alternatives && suggestion.alternatives.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2"><b>Alternatives:</b></Typography>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {suggestion.alternatives.map((alt, i) => <li key={i}>{alt}</li>)}
              </ul>
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" size="small" onClick={handleAccept} sx={{ mr: 1 }}>Accept</Button>
            <Button variant="outlined" size="small" onClick={handleModify} sx={{ mr: 1 }}>Modify</Button>
            <Button variant="text" size="small" onClick={handleSkip}>Skip</Button>
          </Box>
        </Card>
      )}
      <Dialog open={showEdit} onClose={() => setShowEdit(false)}>
        <DialogTitle>Modify Organization Suggestion</DialogTitle>
        <DialogContent>
          <TextField
            label="Suggested Path"
            value={editPath}
            onChange={e => setEditPath(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Tags (comma separated)"
            value={editTags.join(', ')}
            onChange={e => setEditTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationSuggestion; 