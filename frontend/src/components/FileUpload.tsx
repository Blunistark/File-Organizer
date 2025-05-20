import React, { useRef, useState } from 'react';
import { Box, Button, Typography, LinearProgress, Paper, IconButton, List, ListItem, ListItemAvatar, ListItemText, Avatar, Snackbar, Tooltip } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/files/upload';

const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) return <ImageIcon />;
  if (file.type === 'application/pdf') return <PictureAsPdfIcon />;
  return <InsertDriveFileIcon />;
};

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [name: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [name: string]: 'pending' | 'uploading' | 'success' | 'error' }>({});
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; color: 'success' | 'error' }>({ open: false, message: '', color: 'success' });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setUploadProgress({});
    setUploadStatus({});
    let allSuccess = true;
    for (const file of selectedFiles) {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      const formData = new FormData();
      formData.append('file', file);
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL, true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(prev => ({ ...prev, [file.name]: Math.round((event.loaded / event.total) * 100) }));
          }
        };
        await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
              resolve(null);
            } else {
              setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
              reject(new Error('Upload failed.'));
            }
          };
          xhr.onerror = () => {
            setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
            reject(new Error('Upload failed.'));
          };
          xhr.send(formData);
        });
      } catch (error) {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        allSuccess = false;
      }
    }
    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress({});
    setSnackbar({
      open: true,
      message: allSuccess ? 'All files uploaded successfully!' : 'Some files failed to upload.',
      color: allSuccess ? 'success' : 'error',
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, margin: '2rem auto' }}>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: dragActive ? '2px solid #1976d2' : '2px dashed #aaa',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          background: dragActive ? '#e3f2fd' : '#fafafa',
          cursor: 'pointer',
          transition: 'border 0.2s, background 0.2s',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          multiple
        />
        <Typography variant="h6" gutterBottom>
          Drag & drop files here, or click to select
        </Typography>
        {selectedFiles.length > 0 && (
          <List dense>
            {selectedFiles.map((file, idx) => (
              <ListItem key={file.name} secondaryAction={
                <Tooltip title="Remove">
                  <IconButton edge="end" onClick={e => { e.stopPropagation(); handleRemoveFile(idx); }}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              }>
                <ListItemAvatar>
                  <Avatar>
                    {getFileIcon(file)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(1)} KB`}
                />
                {uploadStatus[file.name] && (
                  <Box sx={{ minWidth: 80 }}>
                    <Typography variant="caption" color={uploadStatus[file.name] === 'success' ? 'success.main' : uploadStatus[file.name] === 'error' ? 'error.main' : 'textSecondary'}>
                      {uploadStatus[file.name] === 'success' ? 'Uploaded' : uploadStatus[file.name] === 'error' ? 'Error' : ''}
                    </Typography>
                    {uploadStatus[file.name] === 'uploading' && (
                      <LinearProgress variant="determinate" value={uploadProgress[file.name] || 0} sx={{ height: 6, mt: 0.5 }} />
                    )}
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      <Box mt={2}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!selectedFiles.length || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{ sx: { bgcolor: snackbar.color === 'success' ? 'success.main' : 'error.main', color: 'white' } }}
      />
    </Paper>
  );
};

export default FileUpload; 