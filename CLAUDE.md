# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Word星辉点 (Word Xinghuidian) is an intelligent Word editor that combines manual editing with AI content generation. It's a full-stack web application with a React frontend and Node.js/Express backend, integrating with Qianwen AI for content generation.

## Development Commands

### Initial Setup

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Configure environment variables
cp .env.example .env
# Edit .env to add your QIANWEN_API_KEY
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Run individually
npm run dev:frontend  # Frontend at http://localhost:3000
npm run dev:backend   # Backend at http://localhost:3001
```

### Build & Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

### Testing & Linting

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && npm run lint
cd backend && npm test
```

## Architecture

### Frontend Structure

- **React 18 + TypeScript** application built with Vite
- **State Management**: Zustand stores in `frontend/src/stores/`
- **Routing**: React Router with pages in `frontend/src/pages/`
- **Components**: Modular components in `frontend/src/components/`
  - `Editor/`: Rich text editor components using Quill.js
  - `Layout/`: Layout and navigation components
- **API Integration**: Service layer in `frontend/src/services/`
- **Styling**: Tailwind CSS with custom components

### Backend Structure

- **Express + TypeScript** API server
- **Routes**: API endpoints in `backend/src/routes/`
  - `/api/ai/generate`: AI content generation via Qianwen API
  - `/api/templates`: Template CRUD operations
  - `/api/documents/*`: Document import/export/preview
- **Services**: Business logic in `backend/src/services/`
- **Storage**: File-based storage in `backend/data/`
  - Templates stored as JSON files in `backend/data/templates/`
- **Security**: Helmet, CORS, rate limiting configured

### Key Integration Points

- **AI Generation**: Backend integrates with Qianwen API using axios, requiring `QIANWEN_API_KEY` environment variable
- **Document Processing**: Uses docx.js for Word document generation and manipulation
- **Rich Text Editing**: Quill.js editor with custom toolbar and format configurations
- **Template System**: Distinguishes between fixed content blocks and AI-generated content areas

### Environment Configuration

Essential environment variables:

```env
# Backend (.env)
QIANWEN_API_KEY=your_key_here
QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
PORT=3001
NODE_ENV=development

# Frontend (configured via Vite proxy)
VITE_API_BASE_URL=http://localhost:3001/api
```

### Development Notes

- Frontend uses Vite proxy to forward `/api` requests to backend during development
- Backend uses file system for data persistence (no database required)
- Monorepo structure managed with npm scripts and concurrently
- TypeScript configured for ESM in frontend, CommonJS in backend
