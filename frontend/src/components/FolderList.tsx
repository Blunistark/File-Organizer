import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, List, ListItemText, CircularProgress, Button, ListItemButton, 
  TextField, Stack, IconButton, Divider, ListItem, ListItemAvatar 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
  const theme = useTheme();
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create folder');
      }
      setNewFolderName('');
      fetchFolders();
    } catch (err: any) {
      alert(err.message || 'Create folder failed');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this folder? This might also delete its content.')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete folder');
      }
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
      const parentPath = folder.parentId ? (folders.find(f => f.id === folder.parentId)?.path || '/') : '/';
      const newPath = parentPath === '/' ? `/${editName}` : `${parentPath}/${editName}`;
      const res = await fetch(`${API_URL}/${folder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, path: newPath })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to rename folder');
      }
      setEditingId(null);
      setEditName('');
      fetchFolders();
    } catch (err: any) {
      alert(err.message || 'Rename failed');
    }
  };

  const commonButtonStyles = {
    height: '40px',
    padding: theme.spacing(1, 2), // 8px 16px
    borderRadius: theme.shape.borderRadius, // Should be 4px from theme
  };
  
  const commonTextFieldStyles = {
    '& .MuiOutlinedInput-root': {
      height: '40px', // Input height
      borderRadius: theme.shape.borderRadius, // 4px
      '& fieldset': {
        borderColor: '#DADCE0', // Standard border color
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main, // Or a slightly darker grey
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main, // Focus border color
      },
    },
    '& .MuiInputLabel-root': { // Style for the label
        // Adjust if label is not positioned correctly with 40px height
    },
  };


  return (
    <Box sx={{ 
      maxWidth: 400, 
      margin: theme.spacing(4, 'auto'), // 32px auto
      padding: theme.spacing(2) // 16px padding for the container
    }}>
      <Typography variant="h3" gutterBottom sx={{ mb: theme.spacing(3) }}> 
        Folders
      </Typography>
      
      <form onSubmit={handleCreateFolder}>
        <Stack direction="row" spacing={theme.spacing(1)} mb={theme.spacing(2)}>
          <TextField
            fullWidth
            size="small" // MUI's small size helps with 40px height
            label="New Folder Name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            disabled={creating}
            sx={commonTextFieldStyles}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={creating || !newFolderName.trim()}
            sx={commonButtonStyles}
          >
            Create
          </Button>
        </Stack>
      </form>

      {selectedFolderId && (
        <Button 
          onClick={handleBack} 
          variant="text" 
          color="primary" 
          startIcon={<ArrowBackIcon />}
          sx={{ mb: theme.spacing(2), textTransform: 'none', fontWeight: theme.typography.button.fontWeight }}
        >
          Back
        </Button>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: theme.spacing(3) }}><CircularProgress /></Box>
      ) : error ? (
        <Typography variant="body1" color="error" sx={{ my: theme.spacing(2) }}>{error}</Typography>
      ) : (
        <List sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius }}>
          {visibleFolders.length === 0 && !selectedFolderId && (
             <Typography variant="body1" sx={{ p: theme.spacing(2), textAlign: 'center' }}>
               No root folders. Create one to get started!
             </Typography>
          )}
          {visibleFolders.length === 0 && selectedFolderId && (
             <Typography variant="body1" sx={{ p: theme.spacing(2), textAlign: 'center' }}>
               This folder is empty.
             </Typography>
          )}
          {visibleFolders.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <ListItem 
                disablePadding
                sx={{ 
                  minHeight: '56px', // Target row height
                  '&:hover': { bgcolor: theme.palette.action.hover } 
                }}
                secondaryAction={
                  editingId !== folder.id && (
                    <Stack direction="row" spacing={theme.spacing(0.5)} sx={{ mr: theme.spacing(1) }}>
                      <IconButton edge="end" aria-label="edit" color="primary" onClick={() => handleEdit(folder)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" color="error" onClick={() => handleDelete(folder.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  )
                }
              >
                {editingId === folder.id ? (
                  <Stack direction="row" alignItems="center" spacing={theme.spacing(1)} sx={{ p: theme.spacing(1, 2), width: '100%' }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleEditSubmit(folder); }
                        if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
                      }}
                      autoFocus
                      sx={{ ...commonTextFieldStyles, flexGrow: 1 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => handleEditSubmit(folder)} 
                      sx={commonButtonStyles}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => setEditingId(null)}
                      sx={commonButtonStyles}
                    >
                      Cancel
                    </Button>
                  </Stack>
                ) : (
                  <ListItemButton 
                    onClick={() => handleNavigate(folder.id)} 
                    sx={{ 
                      py: theme.spacing(1.5), // Adjust padding for height
                      pl: theme.spacing(2), // Padding left
                      pr: editingId === folder.id ? theme.spacing(1) : theme.spacing(10) // Adjust right padding for actions
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 'auto', mr: theme.spacing(1.5) }}>
                      <FolderIcon sx={{ color: theme.palette.accent?.main || '#FBBC05' }} />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={folder.name} 
                      secondary={folder.path} 
                      primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'body2', color: theme.palette.text.secondary }}
                    />
                  </ListItemButton>
                )}
              </ListItem>
              {index < visibleFolders.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FolderList;