# File Organizer System - Project Brief

## Project Overview
A comprehensive file organization system that automatically categorizes and organizes uploaded files based on their content and context using a local small LLM.

## Core Features
1. **Intelligent File Organization**: Uses a local small LLM to analyze file content and suggest appropriate folder organization.
2. **Organization Preview**: Shows users where files will be saved before confirming.
3. **Hierarchical Folder Structure**: Supports folders within folders for detailed organization.
4. **Local RAG System**: Implements Retrieval Augmented Generation for improved context understanding.

## Technical Stack
- **Frontend**: React.js
- **Backend**: Node.js with PostgreSQL
- **AI Components**: 
  - Local small LLM for file content analysis
  - RAG (Retrieval Augmented Generation) system
  - MCP (Model Control Protocol) servers

## User Experience Goals
- Intuitive file uploading interface
- Seamless organization process
- Minimal user intervention required
- Fast and responsive application

## Deployment
- All components run locally including LLM and database
- No cloud dependencies required for core functionality 