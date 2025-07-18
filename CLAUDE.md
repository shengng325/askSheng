# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an AI-powered job application assistant web app that helps recruiters and hiring managers learn about the job applicant through an interactive chat interface. The app uses token-based access control and tracks usage analytics per job application.

## Tech Stack
- **Frontend/Backend**: Next.js (full-stack framework)
- **Database**: PostgreSQL (Vercel Postgres for production, Docker Compose for local development)
- **LLM Provider**: OpenAI API
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with minimalist design (Muji-style, beige/white color scheme)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check

# Start local PostgreSQL with Docker Compose
docker-compose up -d

# Stop local PostgreSQL
docker-compose down

# Database migrations
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Architecture Overview

### Core Components
1. **Chat Interface**: Main user interaction point with simulated "thinking" UX
2. **Token Management System**: Generate and validate access tokens with usage limits
3. **Knowledge Base**: Markdown-based configuration for applicant information
4. **Analytics Tracking**: Monitor token usage and conversation data
5. **LLM Integration**: OpenAI API integration for chat responses

### Key Features
- **Access Control**: Each token allows 30 messages or 30-day validity (whichever comes first)
- **Session Isolation**: No chat history persistence across page refreshes
- **Application Tracking**: Tokens tied to specific job applications with labels
- **Usage Analytics**: Track which applications generate engagement

### Database Schema
- **Tokens**: Store access tokens, labels, usage limits, expiration
- **Conversations**: Log chat interactions tied to tokens
- **Analytics**: Track token usage patterns and application sources

### Configuration Files
- **Knowledge Base**: `knowledge-base.md` containing applicant information
- **System Prompts**: Configurable LLM instructions in environment variables
- **Environment Variables**: API keys, database connections, deployment configs

## Development Workflow
1. **Local Setup**: Use Docker Compose for PostgreSQL during development
2. **Configuration**: Update knowledge-base.md and system prompts as needed
3. **Token Generation**: Use simple API endpoint for creating labeled tokens
4. **Testing**: Ensure chat functionality works with token validation
5. **Deployment**: Deploy to Vercel with Vercel Postgres integration

## Security Considerations
- Never expose OpenAI API keys in client-side code
- Implement proper token validation and rate limiting
- Sanitize user inputs before LLM processing
- Use environment variables for sensitive configuration

## Key Implementation Notes
- Implement UX elements that simulate AI "thinking" during response generation
- Ensure chat history doesn't persist across sessions for the same token
- Design responsive chat interface following minimalist aesthetic guidelines
- Log all conversations for analytics but don't expose them to users