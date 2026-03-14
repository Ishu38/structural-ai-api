"""
Configuration for Structural AI API
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Whisper Configuration
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')  # tiny, base, small, medium, large-v3
WHISPER_DEVICE = os.getenv('WHISPER_DEVICE', 'cuda')  # cuda or cpu
WHISPER_COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE_TYPE', 'float16')  # float16, int8, int8_float16

# spaCy Configuration
SPACY_MODEL = os.getenv('SPACY_MODEL', 'en_core_web_lg')

# NLTK Configuration
NLTK_DATA_DIR = os.getenv('NLTK_DATA_DIR', os.path.join(BASE_DIR, 'nltk_data'))

# API Configuration
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', '5000'))
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Rate Limiting (for local testing)
RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '50'))
