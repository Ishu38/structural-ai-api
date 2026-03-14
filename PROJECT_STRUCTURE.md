# Structural AI API - Project Structure

## Fresh File Names (Updated 2026)

All files have been reorganized with modern, descriptive names:

```
structural-ai-api/
│
├── engine/                     # Core linguistic engine (was: src)
│   ├── sonic/                  # Acoustic processing (was: acoustic)
│   │   ├── __init__.py
│   │   └── processor.py        # Faster-Whisper wrapper
│   │
│   ├── struct/                 # Structural parsing (was: parser)
│   │   ├── __init__.py
│   │   └── structural.py       # spaCy POS tagging
│   │
│   ├── syntax/                 # Chomskyan analysis (was: syntactic)
│   │   ├── __init__.py
│   │   └── analyzer.py         # NP/VP/morphemes/ambiguities
│   │
│   ├── gateway/                # API gateway (was: api)
│   │   ├── server.js           # Express.js entry point
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, rate limiting
│   │   ├── models/             # MongoDB schemas
│   │   └── routes/             # API endpoints
│   │
│   ├── pipeline.py             # Main orchestration
│   └── __init__.py
│
├── config/                     # Configuration (unchanged)
│   └── settings.py
│
├── tests/                      # Test suite (unchanged)
│   └── test_pipeline.py
│
├── cloud/                      # Deployment configs (was: deploy)
│   ├── modal_app.py            # Modal deployment
│   ├── runpod.json             # RunPod GPU config
│   ├── render.yaml             # Render deployment
│   ├── railway.json            # Railway deployment
│   ├── MONGODB_ATLAS_SETUP.md
│   └── STRIPE_SETUP.md
│
├── docs/                       # Documentation (unchanged)
│   ├── openapi.json            # Swagger/OpenAPI spec
│   ├── CODE_EXAMPLES.md        # Python, JS, cURL examples
│   └── LANDING_PAGE.md         # Marketing copy
│
├── Dockerfile                  # Main Docker config
├── docker-compose.yml          # Multi-container setup
├── nixpacks.toml               # Railway/Nixpacks config
├── package.json                # Node.js dependencies
├── requirements.txt            # Python dependencies
├── setup.sh                    # Automated setup script
├── README.md                   # Main documentation
├── QUICKSTART.md               # Quick start guide
├── .env.example                # Environment template
└── .gitignore                  # Git ignore rules
```

## Key Changes

| Old Name | New Name | Reason |
|----------|----------|--------|
| `src/` | `engine/` | More descriptive of core functionality |
| `src/acoustic/` | `engine/sonic/` | Shorter, modern |
| `src/parser/` | `engine/struct/` | Clearer purpose |
| `src/syntactic/` | `engine/syntax/` | Simpler |
| `src/api/` | `engine/gateway/` | Describes function |
| `deploy/` | `cloud/` | Broader scope |
| `linguistic-core/` | *(removed)* | Old, redundant |

## Quick Commands

```bash
# Test the engine
python -m engine.pipeline "Your text here"

# Run tests
pytest tests/test_pipeline.py -v

# Start Docker
docker-compose up

# Deploy to Modal
modal deploy cloud/modal_app.py
```
