import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItemText, CircularProgress, Button, ListItemButton, TextField, Stack, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
}

interface FolderListProps {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/folders';

const FolderList: React.FC<FolderListProps> = ({ selectedFolderId, setSelectedFolderId }) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchFolders = () => {
    setLoading(true);
    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch folders');
        const data = await res.json();
        setFolders(data.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Filter folders by selected parent
  const visibleFolders = folders.filter(f => f.parentId === selectedFolderId);

  const handleNavigate = (id: string) => {
    setSelectedFolderId(id);
  };

  const handleBack = () => {
    const parentFolder = folders.find(f => f.id === selectedFolderId);
    setSelectedFolderId(parentFolder?.parentId || null);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreating(true);
    try {
      const parentPath = selectedFolderId ? (folders.find(f => f.id === selectedFolderId)?.path || '/') : '/';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parentId: selectedFolderId,
          path: parentPath === '/' ? `/${newFolderName}` : `${parentPath}/${newFolderName}`
        })
      });
      if (!res.ok) throw new Error('Failed to create folder');
      setNewFolderName('');
      fetchFolders();
    } catch (err: any) {
      alert(err.message || 'Create folder failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete folder');
      fetchFolders();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleEdit = (folder: FolderItem) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const handleEditSubmit = async (folder: FolderItem) => {
    if (!editName.trim()) return;
    try {
      // Update path as well
      const parentPath = folder.parentId ? (folders.find(f => f.id === folder.parentId)?.path || '/') : '/';
      const newPath = parentPath === '/' ? `/${editName}` : `${parentPath}/${editName}`;
      const res = await fetch(`${API_URL}/${folder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, path: newPath })
      });
      if (!res.ok) throw new Error('Failed to rename folder');
      setEditingId(null);
      setEditName('');
      fetchFolders();
    } catch (err: any) {
      alert(err.message || 'Rename failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: '2rem auto' }}>
      <Typography variant="h6" gutterBottom>
        Folders
      </Typography>
      <form onSubmit={handleCreateFolder}>
        <Stack direction="row" spacing={1} mb={2}>
          <TextField
            size="small"
            label="New Folder"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            disabled={creating}
          />
          <Button type="submit" variant="contained" disabled={creating || !newFolderName.trim()}>
            Create
          </Button>
        </Stack>
      </form>
      {selectedFolderId && (
        <Button onClick={handleBack} sx={{ mb: 2 }}>&larr; Back</Button>
      )}
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : visibleFolders.length === 0 ? (
        <Typography>No folders found.</Typography>
      ) : (
        <List>
          {visibleFolders.map((folder) => (
            <Stack direction="row" alignItems="center" key={folder.id}>
              {editingId === folder.id ? (
                <>
                  <TextField
                    size="small"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => handleEditSubmit(folder)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSubmit(folder);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    sx={{ flex: 1, mr: 1 }}
                  />
                  <Button size="small" variant="contained" onClick={() => handleEditSubmit(folder)} sx={{ mr: 1 }}>
                    Save
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <ListItemButton onClick={() => handleNavigate(folder.id)} sx={{ flex: 1 }}>
                    <ListItemText primary={folder.name} secondary={folder.path} />
                  </ListItemButton>
                  <IconButton edge="end" aria-label="edit" color="primary" onClick={() => handleEdit(folder)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDelete(folder.id)}>
                    <DeleteIcon />
                  </IconButton>
                </>
              )}
            </Stack>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FolderList;