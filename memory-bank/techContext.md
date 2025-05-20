# Technical Context

## Frontend
- **React.js**: Single-page application framework
- **Material UI**: Component library for consistent UI
- **React Router**: For navigation between different views
- **React Query**: For data fetching and cache management
- **Drag and Drop API**: For intuitive file organization

## Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework for API endpoints
- **PostgreSQL**: Relational database for storing file metadata and folder structures
  - Tables for files, folders, user preferences, file tags
  - JSON fields for flexible metadata storage
- **Sequelize/Prisma**: ORM for database interactions

## AI Components
- **LLM **:
  - Ollama: For easy local model deployment
- **Vector Database**:
  - Chroma DB 
- **RAG Implementation**:
  - LangChain for local RAG pipeline
  - Local embeddings generation

## File Processing
- **File Type Handling**:
  - PDF processing: PyPDF
  - Image processing: Sharp 
  - Text extraction: Various libraries based on file types
- **Metadata Extraction**:
  - Exiftool for media files
  - Custom parsers for document formats

## Local Deployment
- **Docker**: Containerization for consistent deployment
- **Local Network**: Configuration for access within local network only
- **Data Storage**: Local file system with backup options 