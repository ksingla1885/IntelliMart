# Docker Deployment Guide

This project is now "Docker ready". You can run both the frontend and backend using Docker and Docker Compose.

## Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Project Structure
- `backend/Dockerfile`: Handles the Node.js API with Prisma client generation.
- `frontend/Dockerfile`: Multi-stage build (Node.js build then Nginx production server).
- `docker-compose.yml`: Orchestrates both services.
- `.dockerignore`: Root level and service level ignore files to keep images small.

## Quick Start
To start the entire application in the background:
```bash
docker-compose up --build -d
```

## Accessing the Services
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## Useful Commands

### 1. View Logs
```bash
docker-compose logs -f
```

### 2. Stop Services
```bash
docker-compose down
```

### 3. Rebuild Individual Service
```bash
docker-compose build backend
```

## Troubleshooting
- **Database Connection**: Ensure the `DATABASE_URL` in `backend/.env` is accessible from within the container (for Supabase/remote DBs, this is usually not an issue as long as you have internet access).
- **Environment Variables**: The `docker-compose.yml` automatically loads environment variables from `./backend/.env` and `./frontend/.env`.

---
*Created by Antigravity*
