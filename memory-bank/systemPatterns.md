# System Patterns

## Architecture Pattern
The File Organizer follows a layered architecture with clear separation of concerns:

```
┌───────────────────┐
│     Frontend      │
│  (React, MUI)     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   API Gateway     │
│    (Express)      │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐ ┌─────────┐
│ Service │ │  LLM    │
│ Layer   │ │ Service │
└─────┬───┘ └───┬─────┘
      │         │
┌─────▼───┐ ┌───▼─────┐
│ Data    │ │ Vector  │
│ Store   │ │ Store   │
└─────────┘ └─────────┘
```

## Data Flow Patterns

### File Upload and Analysis
```
User → Upload File → Temporary Storage → Content Extraction → 
LLM Analysis → Organization Suggestion → User Review → Final Storage
```

### Folder Navigation
```
User Request → Folder Query → Database Retrieval → 
Hierarchical Structure Assembly → UI Rendering
```

### Content-Based Search
```
Search Query → Text Embedding → Vector Similarity Search → 
Matching Files Retrieval → Result Ranking → UI Display
```

## Reusable Component Patterns

### Frontend Components
- **FileUploader**: Handles file selection, preview, and upload
- **FolderTree**: Displays hierarchical folder structure
- **OrganizationPreview**: Shows suggested file organization
- **FileCard**: Displays file metadata and preview
- **SearchBar**: Provides content and metadata search

### Backend Services
- **FileService**: Manages file operations (upload, move, delete)
- **FolderService**: Handles folder operations (create, navigate)
- **AnalysisService**: Coordinates file content analysis
- **LLMService**: Interfaces with local LLM
- **RAGService**: Manages retrieval augmented generation

## Database Patterns

### Entity Relationships
```
User (1) ─┬─ (N) Folder
          │
          └─ (N) File

Folder (1) ─── (N) Folder (Parent-Child)
        (1) ─── (N) File

File (N) ─── (N) Tag
```

### Query Patterns
- Hierarchical folder retrieval with recursive CTEs
- Full-text search on file metadata
- JSON path queries for complex metadata
- Pagination for large folder contents

## LLM Integration Patterns

### Inference Optimization
- Batched processing for multiple files
- Caching of similar document analyses
- Progressive loading of large files

### RAG Processing Pipeline
```
Document → Chunking → Embedding → Storage →
Query → Retrieval → Context Assembly → LLM Prompt
``` 