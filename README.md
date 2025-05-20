# File Organizer System

A robust, user-friendly file/folder management system with advanced, context-aware LLM-powered organization suggestions and a modern, polished UI/UX. Supports file/folder CRUD, tagging, metadata editing, advanced search/filtering, and LLM-powered organization (single, batch, folder-level) using a Retrieval-Augmented Generation (RAG) pipeline.

---

## Features
- **File/Folder CRUD**: Create, read, update, delete files and folders
- **Tagging & Metadata**: Add, edit, and filter by tags and metadata
- **Advanced Search/Filtering**: By tag, type, size, date, and more
- **LLM-Powered Organization**: Get smart suggestions for file/folder structure using local LLMs (via MCP microservice)
- **Batch & Folder Suggestions**: Organize multiple files or entire folders at once
- **Context-Aware (RAG)**: Uses vector DB (Chroma) to provide context for smarter suggestions
- **Modern UI/UX**: Responsive React frontend with Material UI

---

## Tech Stack
- **Frontend**: React, Material UI, React Query
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **LLM Microservice (MCP)**: FastAPI, LangChain, OpenRouter/OpenAI API
- **Vector DB**: Chroma DB (for RAG context)
- **Containerization**: Docker (recommended for Chroma and future deployment)

---

## Quick Start

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd File-Organizer
```

### 2. Start Chroma Vector DB (Required for RAG)
```sh
docker run -d -p 8000:8000 ghcr.io/chroma-core/chroma:latest
```

### 3. Backend Setup
```sh
cd backend
cp .env.example .env  # Edit .env as needed
npm install
npm run migrate  # or npx prisma migrate deploy
npm run dev
```
- Ensure `.env` includes:
  - `DATABASE_URL=...` (your PostgreSQL connection)
  - `CHROMA_URL=http://localhost:8000`
  - `OPENAI_API_KEY=...` (for embeddings, or use local model)

### 4. MCP (LLM Microservice) Setup
```sh
cd backend/mcp
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Edit as needed
uvicorn app:app --reload --port 8001
```
- Ensure `.env` includes your OpenRouter/OpenAI API key.

### 5. Frontend Setup
```sh
cd frontend
npm install
npm start
```

---

## Usage
- **Upload files** via the web UI
- **Organize**: Use single, batch, or folder-level organization suggestions
- **Accept/Modify**: Apply LLM suggestions to your files/folders
- **Search/Filter**: Use advanced search and filtering options
- **Tag/Metadata**: Edit tags and metadata for better organization

---

## Environment Variables
- `CHROMA_URL`: URL for Chroma vector DB (default: `http://localhost:8000`)
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: For embedding generation (or use local model)
- `REACT_APP_API_URL`: Frontend API base URL (default: `http://localhost:5000/api`)

---

## Project Structure
```
File-Organizer/
  backend/         # Node.js/Express/Prisma API
    mcp/           # FastAPI LLM microservice (MCP)
    src/           # Source code (controllers, routes, models, etc.)
  frontend/        # React app (Material UI, components, etc.)
  memory-bank/     # Project context, plans, and docs
```

---

## Troubleshooting
- **Chroma not running?** Ensure Docker is running and port 8000 is free.
- **LLM errors?** Check MCP logs and API keys.
- **CORS issues?** Ensure all services allow requests from your frontend URL.
- **Database errors?** Check your PostgreSQL connection and run migrations.

---

## License
MIT (or your chosen license)

---

## Credits
- Built with [Chroma](https://docs.trychroma.com/), [LangChain](https://python.langchain.com/), [OpenRouter](https://openrouter.ai/), [Material UI](https://mui.com/), and more. 