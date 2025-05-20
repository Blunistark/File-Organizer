# File Organizer System - Project Brief

## Project Overview
A robust, user-friendly file/folder management system with advanced, context-aware LLM-powered organization suggestions and a modern, polished UI/UX. All major backend and frontend integration, error handling, and user experience issues have been addressed.

## Core Features
- **File/folder CRUD** (create, read, update, delete)
- **Tagging and metadata editing**
- **Advanced search/filtering**
- **LLM-powered organization suggestions** (single, batch, folder-level)
- **Responsive, modern UI/UX**
- **Context-aware suggestions using existing folders/tags**
- **Preview and accept/modify suggestions**
- **Recursive folder/file deletion with tag cleanup**

## Technical Stack
- **Frontend:** React (Material UI, React Query)
- **Backend:** Node.js/Express/Prisma/PostgreSQL
- **LLM Microservice:** FastAPI (LangChain, OpenRouter/OpenAI API)
- **Other:** Docker planned for deployment, CORS enabled, local file storage

## Backend Details
- **Endpoints:** `/api/analyze`, `/api/organize`, `/api/organize/batch`, `/api/organize/folder`
- **LLM Flow:**
  - Model 1: Analyzes file content, summarizes, produces prompt/context.
  - Model 2: Suggests folder path, tags, summary, confidence, reasoning.
- **Enhancements:**
  - Prompt engineering, batch/folder endpoints, tag/taxonomy intelligence, error handling, context-aware suggestions.
  - Recursive folder deletion handles all subfolders/files/tags and foreign key constraints.

## Frontend Details
- **File Upload:** Multi-file, drag-and-drop, progress/status, feedback.
- **File List:** Material UI, icons, tags, actions (preview, download, move, delete, edit), responsive, snackbars, confirmation dialogs.
- **Organization Suggestions:** Single, batch, folder-level; accept/modify/skip; context-aware; creates folders if missing.
- **Dialogs/Modals:** Tag editing, preview, metadata editing, suggestions; loading/error handling; responsive.
- **UI/UX Polish:** Consistent palette, spacing, typography, enhanced search/filter, responsive layouts.

## Troubleshooting & Fixes
- CORS, validation, foreign key, React rendering, and folderId issues resolved.

## Next Steps/Enhancements
- Real file content integration for LLM analysis
- Batch/folder-level organization UI
- Further UI/UX polish
- Option to delete files from disk on backend
- Dockerization for local deployment

## Deployment
- All components run locally (LLM, DB, backend, frontend)
- No cloud dependencies required for core functionality