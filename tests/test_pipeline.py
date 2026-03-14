"""
Test suite for Structural AI Pipeline
Run with: pytest tests/test_pipeline.py -v
"""
import pytest
import sys
import os

# Add engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestStructuralParser:
    """Tests for the structural parser module."""
    
    def test_simple_sentence(self):
        """Test parsing a simple sentence."""
        from engine.struct import StructuralParser
        
        parser = StructuralParser()
        result = parser.parse("The cat sat.")
        
        assert result is not None
        assert len(result['tokens']) == 3
        assert len(result['sentences']) == 1
    
    def test_noun_phrase_detection(self):
        """Test noun phrase extraction."""
        from engine.struct import StructuralParser
        
        parser = StructuralParser()
        result = parser.parse("The quick brown fox jumps.")
        
        noun_phrases = result['noun_phrases']
        assert len(noun_phrases) >= 1
        assert any('fox' in np['text'].lower() for np in noun_phrases)
    
    def test_batch_parsing(self):
        """Test batch parsing."""
        from engine.struct import StructuralParser
        
        parser = StructuralParser()
        texts = ["The cat sat.", "The dog ran."]
        results = parser.parse_batch(texts)
        
        assert len(results) == 2
        assert all(r is not None for r in results)


class TestSyntacticAnalyzer:
    """Tests for the Chomskyan syntactic analyzer."""
    
    def test_np_extraction(self):
        """Test noun phrase structure extraction."""
        from engine.syntax import ChomskyanSyntaxAnalyzer
        
        analyzer = ChomskyanSyntaxAnalyzer()
        result = analyzer.analyze("The quick brown fox jumps.")
        
        assert len(result['noun_phrases']) >= 1
        np = result['noun_phrases'][0]
        assert 'complexity' in np
        assert np['complexity'] in ['SIMPLE', 'MODERATE', 'COMPLEX']
    
    def test_vp_extraction(self):
        """Test verb phrase structure extraction."""
        from engine.syntax import ChomskyanSyntaxAnalyzer
        
        analyzer = ChomskyanSyntaxAnalyzer()
        result = analyzer.analyze("The cat sleeps soundly.")
        
        assert len(result['verb_phrases']) >= 1
        vp = result['verb_phrases'][0]
        assert 'tense' in vp
    
    def test_morpheme_analysis(self):
        """Test morphemic decomposition."""
        from engine.syntax import ChomskyanSyntaxAnalyzer
        
        analyzer = ChomskyanSyntaxAnalyzer()
        result = analyzer.analyze("Running quickly.")
        
        morphemes = result['morphemes']
        running_morph = next((m for m in morphemes if m['word'] == 'Running'), None)
        
        assert running_morph is not None
        assert running_morph['is_complex'] == True
        assert len(running_morph['morphemes']) > 1
    
    def test_ambiguity_detection(self):
        """Test structural ambiguity detection."""
        from engine.syntax import ChomskyanSyntaxAnalyzer
        
        analyzer = ChomskyanSyntaxAnalyzer()
        result = analyzer.analyze("The old man the boat.")
        
        # This garden path sentence should have ambiguities
        assert 'ambiguities' in result


class TestPipeline:
    """Tests for the complete pipeline."""
    
    def test_text_pipeline(self):
        """Test complete text analysis pipeline."""
        from engine import StructuralAIPipeline
        
        pipeline = StructuralAIPipeline()
        result = pipeline.process_text("The cat sat on the mat.")
        
        assert result is not None
        assert 'input' in result
        assert 'structural' in result
        assert 'syntactic' in result
        assert 'metadata' in result
        
        # Check metadata
        assert result['metadata']['token_count'] > 0
        assert result['metadata']['sentence_count'] >= 1
    
    def test_json_serialization(self):
        """Test JSON serialization of results."""
        from engine import StructuralAIPipeline
        import json
        
        pipeline = StructuralAIPipeline()
        result = pipeline.process_text("Test sentence.")
        
        json_str = pipeline.to_json(result)
        parsed = json.loads(json_str)
        
        assert parsed == result
    
    def test_empty_input(self):
        """Test handling of empty input."""
        from engine import StructuralAIPipeline
        
        pipeline = StructuralAIPipeline()
        result = pipeline.process_text("")
        
        assert result is not None
        assert result['metadata']['token_count'] == 0


class TestAcousticProcessor:
    """Tests for the acoustic processor (if audio files available)."""
    
    @pytest.mark.skip(reason="Requires audio file")
    def test_audio_transcription(self):
        """Test audio transcription."""
        from engine.sonic import AcousticProcessor
        
        processor = AcousticProcessor()
        # Requires actual audio file
        # result = processor.transcribe("test.wav")
        # assert result['text'] is not None
        pass


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
