import React, { useState } from 'react';
import './App.css';
import FolderList from './components/FolderList';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';

function App() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  return (
    <div className="App">
      <h1>File Organizer System</h1>
      <FolderList selectedFolderId={selectedFolderId} setSelectedFolderId={setSelectedFolderId} />
      <FileUpload />
      <FileList selectedFolderId={selectedFolderId} />
    </div>
  );
}

export default App;
