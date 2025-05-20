import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, CircularProgress, Link, Menu, MenuItem, Dialog, DialogTitle, DialogContent, TextField, Stack, Chip, Autocomplete, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Dayjs } from 'dayjs';
import OrganizationSuggestion from './OrganizationSuggestion';
import BatchOrganizationSuggestion from './BatchOrganizationSuggestion';
import FolderOrganizationSuggestion from './FolderOrganizationSuggestion';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

interface FileItem {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  id?: string;
  folderId?: string | null;
}

interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
}

interface TagItem {
  id: string;
  name: string;
}

interface FileListProps {
  selectedFolderId: string | null;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/files';
const FOLDER_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/folders';
const TAG_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/tags';

const FileList: React.FC<FileListProps> = ({ selectedFolderId }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [fileTags, setFileTags] = useState<Record<string, TagItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveAnchorEl, setMoveAnchorEl] = useState<null | HTMLElement>(null);
  const [moveFileId, setMoveFileId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tagDialogFile, setTagDialogFile] = useState<FileItem | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tagLoading, setTagLoading] = useState(false);
  const [tagFilter, setTagFilter] = useState<TagItem | null>(null);
  const [editDialogFile, setEditDialogFile] = useState<FileItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [sizeMin, setSizeMin] = useState<string>('');
  const [sizeMax, setSizeMax] = useState<string>('');
  const [description, setDescription] = useState('');
  const [multiTagFilter, setMultiTagFilter] = useState<TagItem[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; color: 'success' | 'error' }>({ open: false, message: '', color: 'success' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; file?: FileItem }>({ open: false });

  const fetchFiles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (tagFilter) params.append('tag', tagFilter.id);
    if (multiTagFilter.length > 0) params.append('tags', multiTagFilter.map(t => t.id).join(','));
    if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
    if (selectedFolderId) params.append('folderId', selectedFolderId);
    if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
    if (dateTo) params.append('dateTo', dateTo.toISOString());
    if (sizeMin) params.append('sizeMin', sizeMin);
    if (sizeMax) params.append('sizeMax', sizeMax);
    if (description.trim()) params.append('description', description.trim());
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    fetch(`${API_URL}?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch files');
        const data = await res.json();
        setFiles(data.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, tagFilter, multiTagFilter, typeFilter, selectedFolderId, dateFrom, dateTo, sizeMin, sizeMax, description, sortBy, sortOrder]);

  const fetchFolders = () => {
    fetch(FOLDER_API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch folders');
        const data = await res.json();
        setFolders(data.data || []);
      })
      .catch(() => {});
  };

  const fetchTags = () => {
    fetch(TAG_API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch tags');
        const data = await res.json();
        setTags(data.data || []);
      })
      .catch(() => {});
  };

  const fetchFileTags = async (fileId: string) => {
    const res = await fetch(`${API_URL}/${fileId}/tags`);
    const data = await res.json();
    setFileTags(prev => ({ ...prev, [fileId]: data.data || [] }));
  };

  useEffect(() => {
    fetchFiles();
    fetchFolders();
    fetchTags();
  }, [fetchFiles, search, tagFilter, multiTagFilter, typeFilter, selectedFolderId, dateFrom, dateTo, sizeMin, sizeMax, description, sortBy, sortOrder]);

  useEffect(() => {
    files.forEach(file => {
      if (file.id) fetchFileTags(file.id);
    });
    // eslint-disable-next-line
  }, [files]);

  const handleDelete = async (filename: string, id?: string) => {
    setDeleteDialog({ open: false });
    try {
      const res = await fetch(`${API_URL}/${id || filename}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete file');
      setFiles((prev) => prev.filter((file) => file.filename !== filename));
      setSnackbar({ open: true, message: 'File deleted', color: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', color: 'error' });
    }
  };

  // Move file logic
  const handleMoveClick = (event: React.MouseEvent<HTMLElement>, file: FileItem) => {
    setMoveAnchorEl(event.currentTarget);
    setMoveFileId(file.id || file.filename);
  };

  const handleMoveClose = () => {
    setMoveAnchorEl(null);
    setMoveFileId(null);
  };

  const handleMoveSelect = async (folderId: string) => {
    if (!moveFileId) return;
    try {
      const res = await fetch(`${API_URL}/${moveFileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      });
      if (!res.ok) throw new Error('Failed to move file');
      fetchFiles();
    } catch (err: any) {
      alert(err.message || 'Move failed');
    } finally {
      handleMoveClose();
    }
  };

  // Tagging logic
  const handleAddTagClick = (file: FileItem) => {
    setTagDialogFile(file);
    setTagInput('');
  };

  const handleAddTag = async (tagName: string) => {
    if (!tagDialogFile) return;
    setTagLoading(true);
    const fileId = tagDialogFile.id || tagDialogFile.filename;
    try {
      await fetch(`${API_URL}/${fileId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagName })
      });
      if (tagDialogFile.id) fetchFileTags(tagDialogFile.id);
      fetchTags();
      setTagInput('');
    } catch {}
    setTagLoading(false);
  };

  const handleRemoveTag = async (file: FileItem, tag: TagItem) => {
    const fileId = file.id || file.filename;
    await fetch(`${API_URL}/${fileId}/tags/${tag.id}`, { method: 'DELETE' });
    if (file.id) fetchFileTags(file.id);
  };

  // Edit logic
  const handleEditClick = (file: FileItem) => {
    setEditDialogFile(file);
    setEditName(file.originalName || '');
    setEditDescription((file as any).description || '');
  };

  const handleEditSave = async () => {
    if (!editDialogFile?.id) return;
    setEditLoading(true);
    try {
      await fetch(`${API_URL}/${editDialogFile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: editName, description: editDescription })
      });
      setEditDialogFile(null);
      setEditName('');
      setEditDescription('');
      fetchFiles();
    } catch {}
    setEditLoading(false);
  };

  // Preview logic
  const handlePreview = async (file: FileItem) => {
    setPreviewFile(file);
    setPreviewContent(null);
    setPreviewLoading(true);
    try {
      if (file.mimeType && file.mimeType.startsWith('image/')) {
        setPreviewContent(file.path);
      } else if (file.mimeType && file.mimeType.startsWith('text/')) {
        const res = await fetch(file.path);
        const text = await res.text();
        setPreviewContent(text);
      } else if (file.mimeType === 'application/pdf') {
        setPreviewContent(file.path);
      } else {
        setPreviewContent('Unsupported file type for preview.');
      }
    } catch {
      setPreviewContent('Failed to load preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewClose = () => {
    setPreviewFile(null);
    setPreviewContent(null);
    setPreviewLoading(false);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.mimeType?.startsWith('image/')) return <ImageIcon />;
    if (file.mimeType === 'application/pdf') return <PictureAsPdfIcon />;
    return <InsertDriveFileIcon />;
  };

  // Filter files by selected folder
  let visibleFiles = files.filter(f => (selectedFolderId ? f.folderId === selectedFolderId : !f.folderId));
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    visibleFiles = visibleFiles.filter(f =>
      (f.originalName || f.filename).toLowerCase().includes(s)
    );
  }
  if (tagFilter) {
    visibleFiles = visibleFiles.filter(f => {
      const fileId = f.id || f.filename;
      const fileTagList = fileTags[fileId] || [];
      return fileTagList.some(tag => tag.id === tagFilter.id);
    });
  }
  if (typeFilter !== 'all') {
    visibleFiles = visibleFiles.filter(f => {
      if (!f.mimeType) return false;
      if (typeFilter === 'image') return f.mimeType.startsWith('image/');
      if (typeFilter === 'text') return f.mimeType.startsWith('text/');
      if (typeFilter === 'pdf') return f.mimeType === 'application/pdf';
      if (typeFilter === 'other') return !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('text/') && f.mimeType !== 'application/pdf';
      return true;
    });
  }

  return (
    <Box sx={{ maxWidth: 800, margin: '2rem auto' }}>
      <Typography variant="h6" gutterBottom>
        Uploaded Files
      </Typography>
      <Button variant="contained" sx={{ mb: 2, mr: 2 }} onClick={() => setBatchDialogOpen(true)}>
        Batch Organization Suggestions
      </Button>
      <Button variant="contained" sx={{ mb: 2 }} color="secondary" onClick={() => setFolderDialogOpen(true)}>
        Folder Organization Suggestion
      </Button>
      <Divider sx={{ my: 2 }} />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          <TextField
            size="small"
            label="Search files"
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: search && (
                <IconButton size="small" onClick={() => setSearch('')}><DeleteIcon fontSize="small" /></IconButton>
              ),
            }}
          />
          <Autocomplete
            options={tags}
            getOptionLabel={option => option.name}
            value={tagFilter}
            onChange={(_, value) => setTagFilter(value)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={params => (
              <TextField {...params} label="Filter by tag" size="small" />
            )}
            sx={{ minWidth: 180 }}
          />
          <Autocomplete
            multiple
            options={tags}
            getOptionLabel={option => option.name}
            value={multiTagFilter}
            onChange={(_, value) => setMultiTagFilter(value)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={params => (
              <TextField {...params} label="Multi-tag filter" size="small" />
            )}
            sx={{ minWidth: 180 }}
          />
          <TextField
            select
            label="Type"
            size="small"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="image">Images</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <DatePicker
            label="Date from"
            value={dateFrom}
            onChange={setDateFrom}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="Date to"
            value={dateTo}
            onChange={setDateTo}
            slotProps={{ textField: { size: 'small' } }}
          />
          <TextField
            size="small"
            label="Min size (bytes)"
            value={sizeMin}
            onChange={e => setSizeMin(e.target.value)}
            sx={{ minWidth: 120 }}
          />
          <TextField
            size="small"
            label="Max size (bytes)"
            value={sizeMax}
            onChange={e => setSizeMax(e.target.value)}
            sx={{ minWidth: 120 }}
          />
          <TextField
            size="small"
            label="Description contains"
            value={description}
            onChange={e => setDescription(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <TextField
            select
            label="Sort by"
            size="small"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="createdAt">Date</MenuItem>
            <MenuItem value="size">Size</MenuItem>
            <MenuItem value="originalName">Name</MenuItem>
          </TextField>
          <TextField
            select
            label="Order"
            size="small"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="desc">Desc</MenuItem>
            <MenuItem value="asc">Asc</MenuItem>
          </TextField>
        </Stack>
      </LocalizationProvider>
      <Divider sx={{ mb: 2 }} />
      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>Loading files...</Typography>
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : visibleFiles.length === 0 ? (
        <Typography>No files uploaded yet.</Typography>
      ) : (
        <List>
          {visibleFiles.map((file) => {
            const fileId = file.id || file.filename;
            const fileTagList = fileTags[fileId] || [];
            return (
              <React.Fragment key={fileId}>
                <ListItem alignItems="flex-start" divider sx={{ flexWrap: 'wrap', alignItems: 'center' }}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Preview"><IconButton color="info" onClick={() => handlePreview(file)}><VisibilityIcon /></IconButton></Tooltip>
                      <Tooltip title="Download"><Link href={file.path} target="_blank" rel="noopener"><IconButton><DownloadIcon /></IconButton></Link></Tooltip>
                      <Tooltip title="Move"><IconButton color="primary" onClick={e => handleMoveClick(e, file)}><DriveFileMoveIcon /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton color="error" onClick={() => setDeleteDialog({ open: true, file })}><DeleteIcon /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton color="primary" onClick={() => handleEditClick(file)}><EditIcon /></IconButton></Tooltip>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>{getFileIcon(file)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<span style={{ fontWeight: 500 }}>{file.originalName || file.filename}</span>}
                    secondary={<>
                      <span>Size: {(file.size / 1024).toFixed(1)} KB | Type: {file.mimeType || 'unknown'}</span>
                      <br />
                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                        {fileTagList.map(tag => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            onDelete={() => handleRemoveTag(file, tag)}
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                        <Chip
                          icon={<AddIcon />}
                          label="Add Tag"
                          size="small"
                          color="primary"
                          onClick={() => handleAddTagClick(file)}
                          sx={{ mb: 0.5 }}
                        />
                      </Stack>
                    </>}
                  />
                </ListItem>
                {/* LLM Organization Suggestion Preview */}
                <OrganizationSuggestion file={file} />
              </React.Fragment>
            );
          })}
        </List>
      )}
      <Menu
        anchorEl={moveAnchorEl}
        open={Boolean(moveAnchorEl)}
        onClose={handleMoveClose}
      >
        {folders.map(folder => (
          <MenuItem key={folder.id} onClick={() => handleMoveSelect(folder.id)}>
            {folder.path}
          </MenuItem>
        ))}
      </Menu>
      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false })}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <b>{deleteDialog.file?.originalName || deleteDialog.file?.filename}</b>?</Typography>
          <Box mt={2}>
            <Button variant="contained" color="error" onClick={() => deleteDialog.file && handleDelete(deleteDialog.file.filename, deleteDialog.file.id)}>
              Delete
            </Button>
            <Button variant="outlined" sx={{ ml: 2 }} onClick={() => setDeleteDialog({ open: false })}>
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      <BatchOrganizationSuggestion
        files={visibleFiles}
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
      />
      <FolderOrganizationSuggestion
        files={visibleFiles}
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        existingFolders={folders.map(f => f.name)}
        existingTags={tags.map(t => t.name)}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert elevation={6} variant="filled" severity={snackbar.color} sx={{ width: '100%' }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default FileList;