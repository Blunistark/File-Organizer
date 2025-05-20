import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Typography, Box } from '@mui/material';
import OrganizationSuggestion from './OrganizationSuggestion';

interface FileItem {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  id?: string;
  folderId?: string | null;
}

interface BatchOrganizationSuggestionProps {
  files: FileItem[];
  open: boolean;
  onClose: () => void;
}

const MCP_API = 'http://localhost:8001/api';

const BatchOrganizationSuggestion: React.FC<BatchOrganizationSuggestionProps> = ({ files, open, onClose }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBatchSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      const batchFiles = files.map(file => ({
        prompt: file.originalName || file.filename,
        file_type: file.mimeType?.includes('pdf') ? 'pdf' : file.mimeType?.includes('image') ? 'image' : 'text',
        user_context: {},
        allowed_tags: [],
      }));
      const res = await fetch(`${MCP_API}/organize/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: batchFiles }),
      });
      if (!res.ok) throw new Error('Failed to get batch suggestions');
      const data = await res.json();
      setResults(data.results);
    } catch (e: any) {
      setError(e.message || 'Error fetching batch suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Batch Organization Suggestions</DialogTitle>
      <DialogContent>
        <Button onClick={handleBatchSuggest} disabled={loading} sx={{ mb: 2 }}>
          {loading ? <CircularProgress size={20} /> : 'Get Suggestions'}
        </Button>
        {error && <Typography color="error">{error}</Typography>}
        <Box mt={2}>
          {results.map((suggestion, idx) => (
            <OrganizationSuggestion
              key={files[idx].id || files[idx].filename}
              file={files[idx]}
              initialSuggestion={suggestion}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchOrganizationSuggestion; 