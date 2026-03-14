"""
Acoustic Ingestion Module using Faster-Whisper
Handles speech-to-text conversion with optimized GPU inference
"""
import torch
from faster_whisper import WhisperModel
from typing import Optional, Dict, Any
from engine.config.settings import (
    WHISPER_MODEL, 
    WHISPER_DEVICE, 
    WHISPER_COMPUTE_TYPE,
    MODELS_DIR
)


class AcousticProcessor:
    """
    Wrapper around Faster-Whisper for acoustic ingestion.
    Optimized for RTX 3050 (6GB VRAM) with float16 precision.
    """
    
    def __init__(self, model_size: str = None, device: str = None):
        """
        Initialize the Whisper model.
        
        Args:
            model_size: Model size (tiny, base, small, medium, large-v3)
            device: Device to run on ('cuda' or 'cpu')
        """
        self.model_size = model_size or WHISPER_MODEL
        self.device = device or WHISPER_DEVICE
        
        # Check CUDA availability
        if self.device == 'cuda' and not torch.cuda.is_available():
            print("CUDA not available, falling back to CPU")
            self.device = 'cpu'
        
        print(f"Loading Whisper model '{self.model_size}' on {self.device}...")
        self.model = WhisperModel(
            self.model_size,
            device=self.device,
            compute_type=WHISPER_COMPUTE_TYPE if self.device == 'cuda' else 'int8'
        )
        print("Model loaded successfully")
    
    def transcribe(
        self, 
        audio_path: str, 
        language: Optional[str] = None,
        task: str = 'transcribe'
    ) -> Dict[str, Any]:
        """
        Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio file
            language: Source language code (None for auto-detect)
            task: 'transcribe' or 'translate' (to English)
            
        Returns:
            Dictionary containing transcription and metadata
        """
        segments, info = self.model.transcribe(
            audio_path,
            language=language,
            task=task,
            vad_filter=True  # Voice activity detection for better accuracy
        )
        
        # Collect all segments
        transcription_parts = []
        segment_details = []
        
        for segment in segments:
            transcription_parts.append(segment.text)
            segment_details.append({
                'start': segment.start,
                'end': segment.end,
                'text': segment.text,
                'confidence': segment.avg_logprob
            })
        
        full_text = ''.join(transcription_parts)
        
        return {
            'text': full_text.strip(),
            'language': info.language,
            'language_probability': info.language_probability,
            'duration': info.duration,
            'segments': segment_details,
            'model': self.model_size,
            'device': self.device
        }
    
    def transcribe_batch(
        self, 
        audio_paths: list,
        language: Optional[str] = None
    ) -> list:
        """
        Transcribe multiple audio files.
        
        Args:
            audio_paths: List of audio file paths
            language: Source language code
            
        Returns:
            List of transcription results
        """
        results = []
        for path in audio_paths:
            try:
                result = self.transcribe(path, language)
                result['status'] = 'success'
                result['file'] = path
            except Exception as e:
                result = {
                    'status': 'error',
                    'file': path,
                    'error': str(e)
                }
            results.append(result)
        
        return results


# Convenience function for quick testing
def process_audio(audio_path: str, language: Optional[str] = None) -> Dict[str, Any]:
    """
    Quick function to process a single audio file.
    
    Args:
        audio_path: Path to audio file
        language: Source language code
        
    Returns:
        Transcription result dictionary
    """
    processor = AcousticProcessor()
    return processor.transcribe(audio_path, language)


if __name__ == '__main__':
    # Test the acoustic processor
    import sys
    
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        result = process_audio(audio_file)
        print(f"Transcription: {result['text']}")
        print(f"Language: {result['language']} (confidence: {result['language_probability']:.2f})")
        print(f"Duration: {result['duration']:.2f}s")
    else:
        print("Usage: python -m src.acoustic.processor <audio_file>")
