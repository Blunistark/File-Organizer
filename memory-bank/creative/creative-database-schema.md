# File Organizer System - Database Schema Design

## Database Overview

The File Organizer System requires a relational database to store metadata about files, folders, and their relationships. PostgreSQL has been selected for its robust support for hierarchical data structures, JSON storage capabilities, and performance optimizations.

## Entity Relationship Diagram

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│     Users      │       │    Folders     │       │     Files      │
├────────────────┤       ├────────────────┤       ├────────────────┤
│ id (PK)        │       │ id (PK)        │       │ id (PK)        │
│ username       │◄──┐   │ name           │   ┌──►│ name           │
│ email          │   │   │ parent_id (FK) │   │   │ folder_id (FK) │
│ password_hash  │   │   │ owner_id (FK)  │───┘   │ owner_id (FK)  │
│ created_at     │   └───│ created_at     │       │ file_path      │
│ updated_at     │       │ updated_at     │       │ file_size      │
└────────────────┘       │ metadata (JSON)│       │ mime_type      │
                         └────────────────┘       │ created_at     │
                                │                  │ updated_at     │
                                │                  │ metadata (JSON)│
                                ▼                  └────────────────┘
                         ┌────────────────┐              │
                         │ Folder_Path    │              │
                         │ (Materialized) │              │
                         ├────────────────┤              │
                         │ id (PK)        │              │
                         │ folder_id (FK) │              │
                         │ path           │              │
                         │ depth          │              │
                         └────────────────┘              │
                                                         │
                         ┌────────────────┐              │
                         │      Tags      │              │
                         ├────────────────┤              │
                         │ id (PK)        │              │
                         │ name           │◄─────────────┘
                         │ category       │              │
                         │ created_at     │              │
                         └────────────────┘              │
                                │                        │
                                ▼                        ▼
                         ┌────────────────┐      ┌────────────────┐
                         │   File_Tags    │      │ File_Embeddings │
                         ├────────────────┤      ├────────────────┤
                         │ file_id (FK)   │      │ id (PK)        │
                         │ tag_id (FK)    │      │ file_id (FK)   │
                         │ confidence     │      │ chunk_index    │
                         │ created_at     │      │ embedding_id   │
                         └────────────────┘      │ created_at     │
                                                 └────────────────┘
```

## Table Definitions

### Users

Stores user account information and authentication details.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::JSONB
);
```

### Folders

Stores folder metadata and supports hierarchical structure through self-referencing relationship.

```sql
CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB,
    UNIQUE(name, parent_id, owner_id)
);

-- Index for faster parent lookups
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
```

### Folder_Path (Materialized View)

A materialized view that precomputes folder paths for efficient navigation.

```sql
CREATE MATERIALIZED VIEW folder_path AS
WITH RECURSIVE folder_tree AS (
    SELECT 
        id, 
        parent_id, 
        name,
        ARRAY[id] AS path_array,
        name AS path,
        1 AS depth
    FROM folders
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT 
        f.id, 
        f.parent_id, 
        f.name,
        ft.path_array || f.id,
        ft.path || '/' || f.name,
        ft.depth + 1
    FROM folders f
    JOIN folder_tree ft ON f.parent_id = ft.id
)
SELECT 
    id,
    parent_id,
    name,
    path_array,
    path,
    depth
FROM folder_tree;

CREATE UNIQUE INDEX idx_folder_path_id ON folder_path(id);
```

### Files

Stores file metadata and reference to physical storage location.

```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    file_path VARCHAR(1024) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB,
    file_hash VARCHAR(64) NULL,
    UNIQUE(name, folder_id)
);

-- Indexes for common queries
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_owner_id ON files(owner_id);
CREATE INDEX idx_files_mime_type ON files(mime_type);
CREATE INDEX idx_files_file_hash ON files(file_hash);

-- GIN index for JSON metadata queries
CREATE INDEX idx_files_metadata ON files USING GIN (metadata jsonb_path_ops);
```

### Tags

Stores categories and tags for file organization.

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category)
);
```

### File_Tags

Junction table for many-to-many relationship between files and tags.

```sql
CREATE TABLE file_tags (
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    confidence FLOAT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (file_id, tag_id)
);

CREATE INDEX idx_file_tags_file_id ON file_tags(file_id);
CREATE INDEX idx_file_tags_tag_id ON file_tags(tag_id);
```

### File_Embeddings

Links files to their vector embeddings stored in the vector database.

```sql
CREATE TABLE file_embeddings (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    embedding_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, chunk_index)
);

CREATE INDEX idx_file_embeddings_file_id ON file_embeddings(file_id);
CREATE INDEX idx_file_embeddings_embedding_id ON file_embeddings(embedding_id);
```

## Common Queries

### Retrieving Full Folder Path

```sql
-- Get the full path for a specific folder
SELECT path FROM folder_path WHERE id = :folder_id;
```

### Finding Files in a Folder (Including Subfolders)

```sql
-- Get all files in a folder and its subfolders
SELECT f.* 
FROM files f
JOIN folder_path fp ON f.folder_id = fp.id
WHERE fp.path_array @> ARRAY[:folder_id];
```

### File Search by Content Tags

```sql
-- Search files by tag
SELECT f.* 
FROM files f
JOIN file_tags ft ON f.id = ft.file_id
JOIN tags t ON ft.tag_id = t.id
WHERE t.name ILIKE :tag_name
ORDER BY ft.confidence DESC;
```

### Finding Similar Files

```sql
-- Find files with similar tags (potential duplicates or related content)
SELECT f2.*, COUNT(t.id) as matching_tags
FROM files f1
JOIN file_tags ft1 ON f1.id = ft1.file_id
JOIN tags t ON ft1.tag_id = t.id
JOIN file_tags ft2 ON ft2.tag_id = t.id
JOIN files f2 ON f2.id = ft2.file_id
WHERE f1.id = :file_id AND f2.id != f1.id
GROUP BY f2.id
ORDER BY matching_tags DESC
LIMIT 10;
```

## Schema Evolution and Migration Strategy

1. **Version Control**: All schema changes will be tracked in versioned migration files.
2. **Forward/Backward Compatibility**: Migrations will be designed to support both upgrading and downgrading.
3. **Data Preservation**: Migrations will include data transformation steps when columns are restructured.
4. **Zero-Downtime Deployment**: Changes will be applied in stages to minimize disruption.

## Data Security and Privacy Considerations

1. **Password Security**: User passwords are stored as secure hashes.
2. **Access Control**: Table-level permissions ensure users can only access their own data.
3. **Encryption**: Sensitive metadata can be encrypted before storage in JSON fields.
4. **Audit Trail**: Critical operations are logged with timestamps and user information.

## Performance Optimization Strategies

1. **Materialized Views**: Precomputed paths for hierarchical data.
2. **Strategic Indexing**: Indexes on commonly queried columns.
3. **JSON Optimization**: GIN indexes on JSON fields for efficient querying.
4. **Query Optimization**: Use of prepared statements and optimized joins.
5. **Partitioning**: For large installations, files table can be partitioned by date or owner. 