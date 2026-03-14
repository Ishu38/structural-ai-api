"""
Structural Parser Module using spaCy
Handles part-of-speech tagging and basic syntactic analysis
"""
import spacy
from typing import Dict, Any, List, Optional
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from config.settings import SPACY_MODEL


class StructuralParser:
    """
    Wrapper around spaCy for structural parsing.
    Provides POS tagging, dependency parsing, and named entity recognition.
    """
    
    def __init__(self, model_name: str = None):
        """
        Initialize spaCy model.
        
        Args:
            model_name: spaCy model to use (default: en_core_web_lg)
        """
        self.model_name = model_name or SPACY_MODEL
        print(f"Loading spaCy model '{self.model_name}'...")
        self.nlp = spacy.load(self.model_name)
        print("spaCy model loaded successfully")
    
    def parse(self, text: str) -> Dict[str, Any]:
        """
        Parse text and extract structural information.
        
        Args:
            text: Input text to parse
            
        Returns:
            Dictionary containing parsed structural data
        """
        doc = self.nlp(text)
        
        # Extract tokens with detailed information
        tokens = []
        for token in doc:
            token_info = {
                'text': token.text,
                'lemma': token.lemma_,
                'pos': token.pos_,
                'tag': token.tag_,
                'dep': token.dep_,
                'shape': token.shape_,
                'is_alpha': token.is_alpha,
                'is_stop': token.is_stop,
                'head': token.head.text,
                'head_pos': token.head.pos_,
                'children': [child.text for child in token.children]
            }
            tokens.append(token_info)
        
        # Extract noun phrases
        noun_phrases = [
            {
                'text': np.text,
                'root': np.root.text,
                'root_pos': np.root.pos_,
                'start': np.start,
                'end': np.end
            }
            for np in doc.noun_chunks
        ]
        
        # Extract named entities
        entities = [
            {
                'text': ent.text,
                'label': ent.label_,
                'start': ent.start,
                'end': ent.end,
                'description': spacy.explain(ent.label_)
            }
            for ent in doc.ents
        ]
        
        # Extract sentences
        sentences = [
            {
                'text': sent.text,
                'start': sent.start,
                'end': sent.end,
                'root': sent.root.text,
                'root_pos': sent.root.pos_
            }
            for sent in doc.sents
        ]
        
        return {
            'text': text,
            'tokens': tokens,
            'noun_phrases': noun_phrases,
            'entities': entities,
            'sentences': sentences,
            'model': self.model_name
        }
    
    def get_pos_distribution(self, text: str) -> Dict[str, int]:
        """
        Get distribution of POS tags in text.
        
        Args:
            text: Input text
            
        Returns:
            Dictionary mapping POS tags to counts
        """
        doc = self.nlp(text)
        pos_counts = {}
        
        for token in doc:
            pos = token.pos_
            pos_counts[pos] = pos_counts.get(pos, 0) + 1
        
        return pos_counts
    
    def parse_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Parse multiple texts efficiently.
        
        Args:
            texts: List of texts to parse
            
        Returns:
            List of parsed results
        """
        docs = self.nlp.pipe(texts)
        results = []
        
        for doc, text in zip(docs, texts):
            tokens = [
                {
                    'text': token.text,
                    'lemma': token.lemma_,
                    'pos': token.pos_,
                    'tag': token.tag_,
                    'dep': token.dep_
                }
                for token in doc
            ]
            
            noun_phrases = [{'text': np.text, 'root': np.root.text} for np in doc.noun_chunks]
            entities = [{'text': ent.text, 'label': ent.label_} for ent in doc.ents]
            
            results.append({
                'text': text,
                'tokens': tokens,
                'noun_phrases': noun_phrases,
                'entities': entities
            })
        
        return results


# Convenience function
def parse_text(text: str) -> Dict[str, Any]:
    """
    Quick function to parse a single text.
    
    Args:
        text: Input text
        
    Returns:
        Parsed structure dictionary
    """
    parser = StructuralParser()
    return parser.parse(text)


if __name__ == '__main__':
    # Test the structural parser
    test_text = "The quick brown fox jumps over the lazy dog."
    result = parse_text(test_text)
    
    print(f"Input: {result['text']}")
    print(f"\nTokens: {len(result['tokens'])}")
    for token in result['tokens'][:5]:
        print(f"  {token['text']}: {token['pos']} ({token['tag']})")
    
    print(f"\nNoun Phrases: {len(result['noun_phrases'])}")
    for np in result['noun_phrases']:
        print(f"  {np['text']} (root: {np['root']})")
