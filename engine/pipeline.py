"""
Structural AI Pipeline
Integrates acoustic ingestion, structural parsing, and Chomskyan syntactic analysis
"""
import json
import sys
import os
from typing import Dict, Any, Optional, Union
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import (
    WHISPER_MODEL,
    WHISPER_DEVICE,
    SPACY_MODEL,
    NLTK_DATA_DIR
)

# Import modules directly to avoid circular imports
from engine.sonic.processor import AcousticProcessor
from engine.struct.structural import StructuralParser
from engine.syntax.analyzer import ChomskyanSyntaxAnalyzer


class StructuralAIPipeline:
    """
    Main pipeline that orchestrates the complete linguistic analysis.
    
    Flow:
    1. Audio → Whisper → Text (if audio input)
    2. Text → spaCy → POS tags, dependencies, entities
    3. POS tags → Chomskyan Analyzer → Deep syntax tree
    """
    
    def __init__(self, whisper_model: str = None, spacy_model: str = None):
        """
        Initialize all pipeline components.
        
        Args:
            whisper_model: Whisper model size for acoustic processing
            spacy_model: spaCy model name for structural parsing
        """
        print("Initializing Structural AI Pipeline...")
        
        # Initialize components (lazy loading for acoustic)
        self._acoustic_processor = None
        self._whisper_model = whisper_model
        
        self._structural_parser = StructuralParser(spacy_model)
        self._syntactic_analyzer = ChomskyanSyntaxAnalyzer()
        
        print("Pipeline initialized successfully\n")
    
    @property
    def acoustic_processor(self) -> AcousticProcessor:
        """Lazy load acoustic processor."""
        if self._acoustic_processor is None:
            self._acoustic_processor = AcousticProcessor(self._whisper_model)
        return self._acoustic_processor
    
    def process_text(self, text: str) -> Dict[str, Any]:
        """
        Process text through the complete linguistic pipeline.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Comprehensive linguistic analysis
        """
        print(f"Processing text: {text[:50]}...")
        
        # Step 1: Structural parsing (POS, dependencies, NPs)
        structural_result = self._structural_parser.parse(text)
        
        # Step 2: Deep Chomskyan syntactic analysis
        pos_tags = [(t['text'], t['tag']) for t in structural_result['tokens']]
        syntactic_result = self._syntactic_analyzer.analyze(text, pos_tags)
        
        # Combine results
        analysis = {
            'input': {
                'text': text,
                'type': 'text',
                'length': len(text)
            },
            'structural': {
                'tokens': structural_result['tokens'],
                'noun_phrases': structural_result['noun_phrases'],
                'entities': structural_result['entities'],
                'sentences': structural_result['sentences']
            },
            'syntactic': {
                'noun_phrases': syntactic_result['noun_phrases'],
                'verb_phrases': syntactic_result['verb_phrases'],
                'morphemes': syntactic_result['morphemes'],
                'ambiguities': syntactic_result['ambiguities'],
                'syntactic_tree': syntactic_result['syntactic_tree']
            },
            'metadata': {
                'token_count': len(structural_result['tokens']),
                'sentence_count': len(structural_result['sentences']),
                'entity_count': len(structural_result['entities']),
                'np_count': len(syntactic_result['noun_phrases']),
                'vp_count': len(syntactic_result['verb_phrases']),
                'ambiguity_count': len(syntactic_result['ambiguities'])
            }
        }
        
        return analysis
    
    def process_audio(self, audio_path: Union[str, Path], language: Optional[str] = None) -> Dict[str, Any]:
        """
        Process audio file through the complete pipeline.
        
        Args:
            audio_path: Path to audio file
            language: Source language code (None for auto-detect)
            
        Returns:
            Comprehensive linguistic analysis including transcription
        """
        audio_path = str(audio_path)
        print(f"Processing audio: {audio_path}...")
        
        # Step 1: Acoustic ingestion (speech-to-text)
        transcription = self.acoustic_processor.transcribe(audio_path, language)
        
        if transcription['status'] == 'error':
            return {
                'error': transcription['error'],
                'file': audio_path
            }
        
        # Step 2: Process transcribed text
        text_analysis = self.process_text(transcription['text'])
        
        # Combine results
        analysis = {
            'input': {
                'file': audio_path,
                'type': 'audio',
                'duration': transcription['duration']
            },
            'acoustic': {
                'transcription': transcription['text'],
                'language': transcription['language'],
                'language_confidence': transcription['language_probability'],
                'segments': transcription['segments']
            },
            'structural': text_analysis['structural'],
            'syntactic': text_analysis['syntactic'],
            'metadata': {
                **text_analysis['metadata'],
                'audio_duration': transcription['duration'],
                'whisper_model': transcription['model'],
                'device': transcription['device']
            }
        }
        
        return analysis
    
    def process_batch(self, inputs: list, input_type: str = 'text') -> list:
        """
        Process multiple inputs in batch.
        
        Args:
            inputs: List of texts or audio paths
            input_type: 'text' or 'audio'
            
        Returns:
            List of analysis results
        """
        results = []
        
        for i, input_item in enumerate(inputs):
            print(f"\nProcessing item {i+1}/{len(inputs)}...")
            
            try:
                if input_type == 'text':
                    result = self.process_text(input_item)
                else:
                    result = self.process_audio(input_item)
                
                result['status'] = 'success'
            except Exception as e:
                result = {
                    'status': 'error',
                    'error': str(e),
                    'input': input_item
                }
            
            results.append(result)
        
        return results
    
    def to_json(self, analysis: Dict[str, Any], indent: int = 2) -> str:
        """
        Convert analysis result to JSON string.
        
        Args:
            analysis: Analysis dictionary
            indent: JSON indentation level
            
        Returns:
            JSON string
        """
        return json.dumps(analysis, indent=indent, ensure_ascii=False)
    
    def save_analysis(self, analysis: Dict[str, Any], output_path: Union[str, Path]) -> None:
        """
        Save analysis result to JSON file.
        
        Args:
            analysis: Analysis dictionary
            output_path: Output file path
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(self.to_json(analysis))
        
        print(f"Analysis saved to: {output_path}")


# Convenience function for quick testing
def analyze(text: str) -> Dict[str, Any]:
    """
    Quick function to analyze a text.
    
    Args:
        text: Input text
        
    Returns:
        Analysis dictionary
    """
    pipeline = StructuralAIPipeline()
    return pipeline.process_text(text)


if __name__ == '__main__':
    import sys
    
    # Test the pipeline
    print("=" * 60)
    print("STRUCTURAL AI PIPELINE - TEST MODE")
    print("=" * 60)
    
    if len(sys.argv) > 1:
        # Process from command line argument
        input_text = ' '.join(sys.argv[1:])
        pipeline = StructuralAIPipeline()
        result = pipeline.process_text(input_text)
        
        print("\n" + "=" * 60)
        print("ANALYSIS RESULTS")
        print("=" * 60)
        print(pipeline.to_json(result, indent=2))
    else:
        # Interactive mode
        print("\nEnter text to analyze (or 'quit' to exit):\n")
        
        pipeline = StructuralAIPipeline()
        
        while True:
            try:
                user_input = input("> ").strip()
                if user_input.lower() in ['quit', 'exit', 'q']:
                    break
                
                if user_input:
                    result = pipeline.process_text(user_input)
                    print("\n" + pipeline.to_json(result, indent=2))
                    print()
            except EOFError:
                break
            except Exception as e:
                print(f"Error: {e}")
