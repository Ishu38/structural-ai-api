# Structural AI Headless API

A production-ready API for deep Chomskyan syntactic analysis and acoustic processing. This engine transforms raw text or audio into structured linguistic JSON, enabling EdTech companies and research labs to automate linguistic annotation at scale.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Acoustic Layer │ ──→ │  Structural Layer│ ──→ │   Syntactic Layer   │
│  (Faster-Whisper)│     │  (spaCy/NLTK)    │     │  (Chomskyan Parser) │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
        ↓                       ↓                        ↓
  Speech-to-Text          POS Tagging            NP/VP Structures
  Audio Transcription     Dependency Parse       Morphemic Analysis
                          NER                    Ambiguity Detection
```

## Features

### Phase 1: Linguistic Core (Local Prototyping)
- ✅ **Acoustic Ingestion**: Faster-Whisper integration for GPU-accelerated speech-to-text
- ✅ **Structural Parser**: spaCy-based POS tagging, dependency parsing, NER
- ✅ **Syntactic Layer**: Custom Chomskyan analysis (NP, VP, morphemes, ambiguities)
- ✅ **Containerization**: Docker setup for reproducible deployments

### Phase 2-5: Coming Soon
- API Gateway (Express.js + MongoDB)
- Automated Billing (Razorpay metered usage - INR pricing)
- Serverless GPU Deployment (Modal/Runway)
- Developer Documentation

## Quick Start

### Prerequisites

- Python 3.10+
- NVIDIA GPU with 6GB+ VRAM (optional, CPU fallback available)
- Docker (for containerized deployment)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd structural-ai-api
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate  # Windows
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_lg
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

### Usage

#### Text Analysis

```python
from engine import StructuralAIPipeline

# Initialize pipeline
pipeline = StructuralAIPipeline()

# Analyze text
result = pipeline.process_text("The quick brown fox jumps over the lazy dog.")

# Output as JSON
import json
print(json.dumps(result, indent=2))
```

#### Audio Analysis

```python
from engine import StructuralAIPipeline

pipeline = StructuralAIPipeline()

# Process audio file
result = pipeline.process_audio("path/to/audio.wav", language="en")

print(json.dumps(result, indent=2))
```

#### Command Line

```bash
# Text analysis
python -m engine.pipeline "The cat sat on the mat."

# Audio analysis
python -m engine.sonic.processor path/to/audio.wav
```

### Docker Deployment

```bash
# Build and run with GPU support
docker-compose up structural-ai

# Run CPU-only version (development)
docker-compose --profile cpu up structural-ai-cpu
```

## Output Format

### Text Analysis Response

```json
{
  "input": {
    "text": "The quick brown fox jumps over the lazy dog.",
    "type": "text",
    "length": 44
  },
  "structural": {
    "tokens": [...],
    "noun_phrases": [...],
    "entities": [...],
    "sentences": [...]
  },
  "syntactic": {
    "noun_phrases": [
      {
        "text": "The quick brown fox",
        "head": "fox",
        "complexity": "MODERATE",
        "structure": {
          "determiner": "The",
          "adjectives": [{"word": "quick", "type": "JJ"}, {"word": "brown", "type": "JJ"}],
          "noun": {"word": "fox", "type": "NN"}
        }
      }
    ],
    "verb_phrases": [...],
    "morphemes": [...],
    "ambiguities": [...],
    "syntactic_tree": {...}
  },
  "metadata": {
    "token_count": 9,
    "sentence_count": 1,
    "np_count": 2,
    "vp_count": 1,
    "ambiguity_count": 0
  }
}
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL` | `base` | Whisper model size (tiny/base/small/medium/large-v3) |
| `WHISPER_DEVICE` | `cuda` | Device for Whisper (cuda/cpu) |
| `WHISPER_COMPUTE_TYPE` | `float16` | Compute precision (float16/int8) |
| `SPACY_MODEL` | `en_core_web_lg` | spaCy model name |
| `API_HOST` | `0.0.0.0` | API server host |
| `API_PORT` | `5000` | API server port |
| `RATE_LIMIT_PER_MINUTE` | `50` | Rate limit for local testing |

## Hardware Requirements

### Minimum (CPU-only)
- 8GB RAM
- 4 CPU cores
- Tiny Whisper model recommended

### Recommended (GPU)
- NVIDIA GPU with 6GB+ VRAM (RTX 3050 or better)
- 16GB RAM
- CUDA 12.1+
- Base/Small Whisper models supported

## Project Structure

```
structural-ai-api/
├── engine/             # Core linguistic engine
│   ├── sonic/          # Faster-Whisper integration
│   ├── struct/         # spaCy structural parsing
│   ├── syntax/         # Chomskyan syntax analysis
│   └── pipeline.py     # Main orchestration
├── gateway/            # Express.js API gateway
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, rate limiting
│   ├── models/         # MongoDB schemas
│   └── routes/         # API endpoints
├── config/             # Configuration
├── tests/              # Test suite
├── cloud/              # Deployment configs
├── docs/               # Documentation
├── Dockerfile          # Container definition
├── docker-compose.yml  # Multi-container setup
└── requirements.txt    # Python dependencies
```

## API Roadmap

### Phase 2: API Gateway
- Express.js server
- MongoDB integration
- API key authentication
- Rate limiting middleware

### Phase 3: Royalty Engine
- Stripe metered billing
- Usage tracking
- Automated invoicing

### Phase 4: Production Deployment
- RunPod/Modal GPU deployment
- Render/Railway API hosting
- MongoDB Atlas setup

### Phase 5: Documentation
- Swagger/OpenAPI specs
- Code snippets (Python, JS, cURL)
- Landing page

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built for EdTech companies and research labs** — Save thousands of hours in manual linguistic annotation with automated, deep syntactic analysis.
