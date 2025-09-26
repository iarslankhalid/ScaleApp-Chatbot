# RAG Chatbot - Dockerized Full Stack Application

A full-stack chatbot application with RAG (Retrieval Augmented Generation) capabilities using NestJS backend and Next.js frontend.

## 🚀 Quick Start with Docker

Run the entire application with a single command:

```bash
docker-compose up --build
```

This will:
- Build and start the NestJS API on port **3005**
- Build and start the Next.js frontend on port **3000**
- Set up proper networking between services

## 📋 Prerequisites

- Docker
- Docker Compose

## 🏗️ Architecture

- **Backend**: NestJS API with OpenAI and Pinecone integration
- **Frontend**: Next.js with React
- **Port Configuration**: 
  - API Server: `3005`
  - Frontend: `3000`

## 🐳 Docker Commands

### Build and Start Services
```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# Start specific service
docker-compose up api
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# All services logs
docker-compose logs

# Specific service logs
docker-compose logs api
docker-compose logs frontend

# Follow logs
docker-compose logs -f
```

### Rebuild Individual Services
```bash
# Rebuild API only
docker-compose build api

# Rebuild frontend only
docker-compose build frontend
```

## 🔧 Environment Variables

Create `.env` files in the respective directories if needed:

### Backend (`rag-chatbot-api/.env`)
```env
PORT=3005
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

### Frontend (`rag-chatbot-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## 📚 API Documentation

Once the application is running, access the API documentation at:
- **Swagger UI**: http://localhost:3005/docs

## 🧪 Development

### Local Development (without Docker)

#### Backend
```bash
cd rag-chatbot-api
npm install
npm run start:dev
```

#### Frontend
```bash
cd rag-chatbot-frontend
npm install
npm run dev
```

### Docker Development
```bash
# Development mode with volume mounting for live reload
docker-compose -f docker-compose.dev.yml up --build
```

## 🔍 Health Checks

The API includes health check endpoints:
- Health: `GET /health`

## 🛠️ Troubleshooting

### Port Conflicts
If ports 3000 or 3005 are already in use:

1. Edit `docker-compose.yml`
2. Change the port mappings:
   ```yaml
   ports:
     - "YOUR_PORT:3005"  # For API
     - "YOUR_PORT:3000"  # For Frontend
   ```

### Build Issues
```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose up --build --force-recreate
```

### View Container Status
```bash
docker-compose ps
```

### Access Container Shell
```bash
# API container
docker-compose exec api sh

# Frontend container
docker-compose exec frontend sh
```

## 📦 Production Deployment

For production deployment:

1. Set proper environment variables
2. Use production Docker images
3. Consider using orchestration tools like Kubernetes
4. Set up proper reverse proxy (nginx)
5. Enable HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.