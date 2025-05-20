# File Organizer System - Architecture Design

## System Architecture Overview

The File Organizer System follows a modern, modular architecture designed to support local processing of files with AI-powered organization capabilities. The system is composed of the following major components:

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ File Upload  │  │    Folder    │  │    Organization     │    │
│  │  Component   │  │   Explorer   │  │   Preview Component │    │
│  └──────┬───────┘  └───────┬──────┘  └──────────┬──────────┘    │
└────────┼────────────────────┼────────────────────┼───────────────┘
         │                    │                    │                
         ▼                    ▼                    ▼                
┌─────────────────────────────────────────────────────────────────┐
│                          API Gateway                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  File API    │  │  Folder API  │  │   Organization API  │    │
│  └──────┬───────┘  └───────┬──────┘  └──────────┬──────────┘    │
└────────┼────────────────────┼────────────────────┼───────────────┘
         │                    │                    │                
┌────────┼────────────────────┼────────────────────┼───────────────┐
│        │                    │                    │               │
│  ┌─────▼──────┐    ┌────────▼─────┐    ┌─────────▼──────┐       │
│  │   File     │    │    Folder    │    │  Organization  │       │
│  │  Service   │    │   Service    │    │    Service     │       │
│  └─────┬──────┘    └──────┬───────┘    └────────┬───────┘       │
│        │                  │                     │               │
│        │                  │                     │               │
│  ┌─────▼──────┐    ┌──────▼───────┐    ┌────────▼───────┐      │
│  │   File     │    │    Folder    │    │  Analysis      │      │
│  │ Repository │    │  Repository  │    │   Service      │      │
│  └─────┬──────┘    └──────┬───────┘    └────────┬───────┘      │
└────────┼────────────────────┼────────────────────┼──────────────┘
         │                    │                    │               
         ▼                    ▼                    ▼               
┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐      
│  File Storage  │  │   PostgreSQL    │  │  LLM Service    │      
│                │  │                 │  │                 │      
└────────────────┘  └─────────────────┘  └────┬────────────┘      
                                               │                   
                                         ┌─────▼────────┐          
                                         │   Vector     │          
                                         │  Database    │          
                                         └──────────────┘          
```

## Component Descriptions

### Frontend Components

1. **File Upload Component**
   - Handles file selection via drag-and-drop or file dialog
   - Processes files for upload to backend
   - Displays upload progress and status
   - Validates file types and sizes

2. **Folder Explorer Component**
   - Displays hierarchical folder structure
   - Enables navigation through folder tree
   - Supports folder creation, renaming, and deletion
   - Shows file previews and metadata

3. **Organization Preview Component**
   - Displays suggested file organization
   - Allows user confirmation or modification of suggestions
   - Shows confidence levels for suggestions
   - Provides alternative organization options

### Backend Services

1. **File Service**
   - Handles file upload and storage
   - Processes file metadata extraction
   - Manages file lifecycle (create, read, update, delete)
   - Implements file deduplication

2. **Folder Service**
   - Manages hierarchical folder structure
   - Handles folder relationships
   - Implements access control for folders
   - Processes folder statistics and metadata

3. **Organization Service**
   - Coordinates file analysis workflow
   - Manages suggestion generation process
   - Handles user feedback on suggestions
   - Maintains organization rules and preferences

4. **Analysis Service**
   - Interfaces with LLM for content analysis
   - Coordinates text extraction from various file types
   - Manages the RAG pipeline
   - Optimizes analysis performance

### Data Stores

1. **PostgreSQL Database**
   - Stores user accounts and authentication data
   - Maintains folder structure and relationships
   - Stores file metadata and organization history
   - Tracks user preferences and settings

2. **File Storage**
   - Local filesystem for storing uploaded files
   - Organized by hashed identifiers to prevent duplication
   - Supports backup and recovery operations
   - Implements access control mechanisms

3. **Vector Database**
   - Stores document embeddings for semantic search
   - Enables similarity-based retrieval for RAG
   - Optimized for fast vector operations
   - Supports incremental updates and batch processing

4. **LLM Service**
   - Hosts the local language model
   - Provides inference API for text analysis
   - Manages model loading and optimization
   - Handles prompt templating and response parsing

## Data Flow

### File Upload and Organization Flow

1. User uploads file(s) through the File Upload Component
2. Files are sent to the File Service via the API Gateway
3. File Service stores the files and extracts basic metadata
4. Analysis Service processes file content:
   - Text extraction based on file type
   - Document chunking and embedding generation
   - Storage of embeddings in Vector Database
5. Organization Service generates organization suggestions:
   - Retrieves relevant context from Vector Database
   - Sends context and file information to LLM Service
   - Processes LLM response into structured suggestions
6. Organization Preview Component displays suggestions to user
7. Upon user confirmation, Folder Service updates the folder structure
8. File is stored in its final location with updated metadata

### File Search and Retrieval Flow

1. User enters search query in the Folder Explorer Component
2. Query is sent to the API Gateway
3. Organization Service processes the query:
   - For semantic search, query is converted to embedding
   - Vector similarity search is performed in Vector Database
   - Results are combined with metadata-based matches
4. Matched files are retrieved with their metadata
5. Results are displayed to the user in the Folder Explorer Component

## Technical Implementation Details

### Authentication and Authorization

- JWT-based authentication with secure token storage
- Role-based access control for multi-user scenarios
- Fine-grained permissions for folder and file operations

### API Design

- RESTful API with consistent resource naming
- WebSocket support for real-time progress updates
- Versioned API endpoints for backward compatibility
- Comprehensive error handling and validation

### Database Schema

- Normalized schema design with appropriate relationships
- Efficient indexing for common query patterns
- JSON fields for flexible metadata storage
- Optimized queries for hierarchical data retrieval

### LLM Integration

- Configurable model selection based on hardware capabilities
- Structured prompt templates for consistent results
- Response validation and error handling
- Performance optimizations for batch processing

### Deployment Architecture

- Docker containers for each service component
- Docker Compose for local deployment
- Environment configuration for development/production
- Resource allocation based on component requirements

## Security Considerations

- Input validation to prevent injection attacks
- Authentication for all API endpoints
- Data encryption for sensitive information
- Proper error handling to prevent information leakage
- Regular security updates for dependencies

## Performance Considerations

- Caching strategies for frequently accessed data
- Asynchronous processing for long-running tasks
- Pagination for large data sets
- Resource monitoring and scaling
- Optimization of LLM inference for local hardware 