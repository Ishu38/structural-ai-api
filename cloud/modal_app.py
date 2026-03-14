# Modal Deployment Configuration
# Deploy to: https://modal.com/

import modal
from modal import Image, App, gpu, Secret

# Create Modal app
app = modal.App("structural-ai-api")

# Define GPU-accelerated image
image = Image.debian_slim(python_version="3.11").pip_install(
    "faster-whisper>=1.0.0",
    "spacy>=3.7.0",
    "nltk>=3.8.0",
    "torch>=2.0.0",
    "transformers>=4.35.0",
    "flask>=3.0.0",
    "flask-cors>=4.0.0",
    "pydantic>=2.5.0"
).run_commands("python -m spacy download en_core_web_lg")

# Create Modal class for the pipeline
StructuralAI = modal.Cls(
    "structural_ai",
    image=image,
    gpu=gpu.T4(),  # or gpu.A10G(), gpu.A100()
    secrets=[Secret.from_dotenv(".")]
)

@app.cls(
    image=image,
    gpu=gpu.T4(),
    timeout=300,
    memory=512
)
class StructuralAIService:
    @modal.enter()
    def load_models(self):
        """Load models on container startup"""
        from src.pipeline import StructuralAIPipeline
        self.pipeline = StructuralAIPipeline(
            whisper_model="base",
            spacy_model="en_core_web_lg"
        )
    
    @modal.method()
    def analyze_text(self, text: str) -> dict:
        """Analyze text for syntactic structure"""
        return self.pipeline.process_text(text)
    
    @modal.method()
    def analyze_audio(self, audio_path: str, language: str = "en") -> dict:
        """Analyze audio file"""
        return self.pipeline.process_audio(audio_path, language)

# HTTP endpoint for API access
@app.function(
    image=image,
    gpu=gpu.T4(),
    secrets=[Secret.from_dotenv(".")],
    allow_concurrent_inputs=10
)
@modal.web_endpoint(method="POST", path="/analyze")
def analyze_web(data: dict):
    """Web endpoint for text analysis"""
    from src.pipeline import StructuralAIPipeline
    pipeline = StructuralAIPipeline()
    return pipeline.process_text(data.get("text", ""))

@app.function(
    image=image,
    gpu=gpu.T4(),
    secrets=[Secret.from_dotenv(".")],
    allow_concurrent_inputs=5
)
@modal.web_endpoint(method="POST", path="/analyze/audio")
def analyze_audio_web(file: modal.InputFile, language: str = "en"):
    """Web endpoint for audio analysis"""
    import tempfile
    from pathlib import Path
    from src.pipeline import StructuralAIPipeline
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as f:
        f.write(file.content)
        temp_path = f.name
    
    try:
        pipeline = StructuralAIPipeline()
        result = pipeline.process_audio(temp_path, language)
        return result
    finally:
        import os
        os.unlink(temp_path)

# Deployment command: modal deploy deploy/modal_app.py
