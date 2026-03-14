# Structural AI API - Quick Start Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- NVIDIA GPU with 6GB+ VRAM (optional, for GPU acceleration)
- Docker (optional, for containerized deployment)

## Installation (5 minutes)

### Option 1: Automated Setup (Recommended)

```bash
cd structural-ai-api
chmod +x setup.sh
./setup.sh
```

This script will:
- Create a virtual environment
- Install all Python dependencies
- Download spaCy language models
- Set up environment files
- Check GPU availability

### Option 2: Manual Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_lg

# Copy environment file
cp .env.example .env
```

## Testing Locally

### Test the Python Pipeline

```bash
# Activate virtual environment
source venv/bin/activate

# Run a test analysis
python -m engine.pipeline "The quick brown fox jumps over the lazy dog."

# Or run interactively
python -m engine.pipeline
> Enter text to analyze: Linguistics is fascinating.
```

### Run Tests

```bash
pytest tests/test_pipeline.py -v
```

## Start the API Server

### Start Python Pipeline Service

```bash
# Terminal 1
source venv/bin/activate
python -m src.pipeline  # Runs on port 5000
```

### Start Node.js API Gateway

```bash
# Terminal 2
cd structural-ai-api
npm install
npm start  # Runs on port 3000
```

## Make Your First API Call

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User"
  }'

# Login and get API key
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Analyze text (replace YOUR_API_KEY with the key from login)
curl -X POST http://localhost:3000/api/analyze/text \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "The cat sat on the mat."}'
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
# GPU version (requires NVIDIA Container Toolkit)
docker-compose up structural-ai

# CPU-only version (for testing)
docker-compose --profile cpu up structural-ai-cpu
```

### Access the API

- API Gateway: http://localhost:3000
- Python Pipeline: http://localhost:5000
- Health Check: http://localhost:3000/health

## Next Steps

1. **Read the Documentation**: See `docs/` folder for complete API docs
2. **Try Code Examples**: See `docs/CODE_EXAMPLES.md`
3. **Deploy to Cloud**: Follow guides in `deploy/` folder
4. **Set Up Billing**: Follow `deploy/STRIPE_SETUP.md`

## Troubleshooting

### CUDA Out of Memory

If you get CUDA OOM errors, use a smaller Whisper model:

```bash
# Edit .env
WHISPER_MODEL=tiny
```

### Module Not Found

Make sure you've activated the virtual environment:

```bash
source venv/bin/activate
```

### Port Already in Use

Change the port in `.env`:

```bash
API_PORT=5001  # Instead of 5000
```

### MongoDB Connection Failed

For local development without MongoDB, the API will still work but won't persist data. To use MongoDB:

```bash
# Install MongoDB locally or use Atlas
# See deploy/MONGODB_ATLAS_SETUP.md
```

## Support

- **Documentation**: `docs/` folder
- **Issues**: GitHub Issues
- **Email**: support@structuralai.app

---

**You're ready to go!** Start analyzing text with deep Chomskyan syntactic analysis.
