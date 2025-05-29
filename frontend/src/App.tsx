import React, { useState } from 'react';
import { Box, Container, Paper, Typography, useTheme } from '@mui/material';
import FolderList from './components/FolderList';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';

function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const theme = useTheme();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      pt: 4,
      pb: 8
    }}>
      <Container maxWidth="xl">
        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            backgroundColor: 'transparent',
            borderRadius: 3
          }}
        >
          <Typography 
            variant="h1" 
            gutterBottom
            sx={{
              textAlign: 'center',
              mb: 4,
              color: theme.palette.primary.main,
              fontWeight: 300,
              letterSpacing: '-1px'
            }}
          >
            File Organizer System
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: '0 0 300px' }}>
              <FolderList 
                selectedFolderId={selectedFolderId} 
                setSelectedFolderId={setSelectedFolderId} 
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FileUpload />
              <FileList selectedFolderId={selectedFolderId} />
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;