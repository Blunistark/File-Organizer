import React, { useRef, useState } from 'react';
import { Box, Button, Typography, LinearProgress, Paper, IconButton, List, ListItem, ListItemAvatar, ListItemText, Avatar, Snackbar, Tooltip, useTheme } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Added for drag-drop zone

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/files/upload';

// Updated getFileIcon to use theme colors
const GetFileIcon: React.FC<{ file: File }> = ({ file }) => {
  const theme = useTheme();
  if (file.type.startsWith('image/')) return <ImageIcon sx={{ color: theme.palette.secondary.main }} />;
  if (file.type === 'application/pdf') return <PictureAsPdfIcon sx={{ color: theme.palette.primary.main }} />; // PDFs as Documents (Blue)
  return <InsertDriveFileIcon sx={{ color: theme.palette.primary.main }} />; // Default to Document (Blue)
};

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [name: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [name: string]: 'pending' | 'uploading' | 'success' | 'error' }>({});
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; color: 'success' | 'error' }>({ open: false, message: '', color: 'success' });
  const theme = useTheme(); // Hook to access theme

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
    setSelectedFiles([]); // Clear files after upload attempt
    setUploadProgress({}); // Clear progress
    setSnackbar({
      open: true,
      message: allSuccess ? 'All files uploaded successfully!' : 'Some files failed to upload.',
      color: allSuccess ? 'success' : 'error',
    });
  };

  return (
    <Paper 
      elevation={0} // Use boxShadow for Level 2 shadow as per style guide
      sx={{ 
        p: theme.spacing(2), // 16px padding
        maxWidth: 500, 
        margin: '2rem auto',
        backgroundColor: theme.palette.background.paper, // Surface color
        borderRadius: theme.spacing(1), // 8px border radius (assuming theme.spacing(1) = 8px, or use theme.shape.borderRadius * 2)
        boxShadow: theme.shadows[2], // Level 2 shadow
      }}
    >
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: dragActive ? `2px solid ${theme.palette.primary.main}` : `2px dashed ${theme.palette.text.secondary}`,
          borderRadius: theme.spacing(1), // 8px, matching Paper
          p: theme.spacing(4), // 32px padding
          textAlign: 'center',
          background: dragActive ? theme.palette.action.hover : theme.palette.background.default,
          cursor: 'pointer',
          transition: 'border 0.2s, background 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200, // Ensure a decent height for the drop zone
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
        <CloudUploadIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ color: theme.palette.text.primary }}>
          Drag & drop files here, or click to select
        </Typography>
        {selectedFiles.length > 0 && (
          <List dense sx={{ width: '100%', mt: 2, background: theme.palette.background.paper, borderRadius: theme.spacing(0.5) }}>
            {selectedFiles.map((file, idx) => (
              <ListItem 
                key={file.name} 
                secondaryAction={
                  <Tooltip title="Remove">
                    {/* Ensure IconButton click doesn't propagate to Box */}
                    <IconButton edge="end" onClick={e => { e.stopPropagation(); handleRemoveFile(idx); }}>
                      <DeleteIcon color="action" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'transparent' }}>
                    <GetFileIcon file={file} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(1)} KB`}
                  primaryTypographyProps={{ sx: { color: theme.palette.text.primary } }}
                  secondaryTypographyProps={{ sx: { color: theme.palette.text.secondary } }}
                />
                {uploadStatus[file.name] && (
                  <Box sx={{ minWidth: 80, textAlign: 'right' }}>
                    <Typography 
                      variant="caption" 
                      color={uploadStatus[file.name] === 'success' 
                        ? theme.palette.secondary.main // Green for success
                        : uploadStatus[file.name] === 'error' 
                        ? theme.palette.error.main // Red for error
                        : theme.palette.text.secondary
                      }
                    >
                      {uploadStatus[file.name] === 'success' ? 'Uploaded' : uploadStatus[file.name] === 'error' ? 'Error' : 'Pending...'}
                    </Typography>
                    {uploadStatus[file.name] === 'uploading' && (
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress[file.name] || 0} 
                        sx={{ 
                          height: 6, 
                          mt: 0.5, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[300], // Lighter background for progress bar
                          '& .MuiLinearProgress-bar': {
                            bgcolor: theme.palette.primary.main, // Primary color for progress
                          }
                        }} 
                      />
                    )}
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      <Box mt={theme.spacing(2)}> {/* 16px margin top */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={!selectedFiles.length || uploading}
          onClick={handleUpload}
          sx={{ 
            height: '40px', 
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`, // 8px 16px
            // Typography and borderRadius should be handled by the global theme's button settings
          }}
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
        ContentProps={{ 
          sx: { 
            bgcolor: snackbar.color === 'success' ? theme.palette.secondary.main : theme.palette.error.main, 
            color: theme.palette.common.white, // Ensure text is white for contrast
            typography: 'body1' // Ensure typography matches style guide
          } 
        }}
      />
    </Paper>
  );
};

export default FileUpload;