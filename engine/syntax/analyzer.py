"""
Syntactic Layer Module
Implements deep Chomskyan syntax tree analysis with:
- Noun Phrase (NP) structure
- Verb Phrase (VP) structure  
- Morphemic breakdowns
- Structural ambiguities detection
"""
import nltk
from typing import Dict, Any, List, Optional, Tuple, Set
from collections import defaultdict
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from config.settings import NLTK_DATA_DIR


class ChomskyanSyntaxAnalyzer:
    """
    Deep syntactic analyzer implementing Chomskyan transformational grammar principles.
    Analyzes phrase structures, morphemes, and detects structural ambiguities.
    """
    
    def __init__(self):
        """
        Initialize the syntactic analyzer with required NLTK resources.
        """
        # Download required NLTK resources
        self._download_nltk_resources()
        
        # Initialize parsers
        self._constituency_parser = None
        self._dependency_parser = None
    
    def _download_nltk_resources(self):
        """Download required NLTK data."""
        resources = [
            'punkt',
            'averaged_perceptron_tagger',
            'maxent_ne_chunker',
            'wordnet',
            'treebank'
        ]
        
        for resource in resources:
            try:
                nltk.data.find(f'taggers/{resource}' if 'tagger' in resource else resource)
            except LookupError:
                print(f"Downloading NLTK resource: {resource}")
                nltk.download(resource, download_dir=NLTK_DATA_DIR, quiet=True)
    
    def _get_constituency_parser(self):
        """Lazy load constituency parser."""
        if self._constituency_parser is None:
            # Using PCFG grammar for constituency parsing
            from nltk import parse
            try:
                self._constituency_parser = parse.ChartParser()
            except Exception:
                self._constituency_parser = None
        return self._constituency_parser
    
    def analyze(self, text: str, pos_tags: Optional[List[Tuple[str, str]]] = None) -> Dict[str, Any]:
        """
        Perform deep Chomskyan syntactic analysis.
        
        Args:
            text: Input text to analyze
            pos_tags: Optional pre-computed POS tags
            
        Returns:
            Dictionary containing syntactic analysis
        """
        # Tokenize
        tokens = nltk.word_tokenize(text)
        
        # Get POS tags
        if pos_tags is None:
            pos_tags = nltk.pos_tag(tokens)
        
        # Analyze different syntactic layers
        np_structures = self._extract_noun_phrases(pos_tags)
        vp_structures = self._extract_verb_phrases(pos_tags)
        morphemic_analysis = self._analyze_morphemes(tokens)
        ambiguities = self._detect_ambiguities(text, pos_tags)
        tree_structure = self._build_syntactic_tree(pos_tags)
        
        return {
            'text': text,
            'tokens': tokens,
            'pos_tags': [(word, tag) for word, tag in pos_tags],
            'noun_phrases': np_structures,
            'verb_phrases': vp_structures,
            'morphemes': morphemic_analysis,
            'ambiguities': ambiguities,
            'syntactic_tree': tree_structure,
            'analysis_metadata': {
                'token_count': len(tokens),
                'np_count': len(np_structures),
                'vp_count': len(vp_structures),
                'ambiguity_count': len(ambiguities)
            }
        }
    
    def _extract_noun_phrases(self, pos_tags: List[Tuple[str, str]]) -> List[Dict[str, Any]]:
        """
        Extract and analyze Noun Phrase (NP) structures.
        
        NP → (Det) (AdjP*) N (PP*)
        """
        noun_phrases = []
        i = 0
        
        while i < len(pos_tags):
            np_start = None
            np_components = {
                'determiner': None,
                'adjectives': [],
                'noun': None,
                'post_modifiers': []
            }
            
            # Look for determiner
            if i < len(pos_tags) and pos_tags[i][1] in ['DT', 'PDT']:
                np_components['determiner'] = pos_tags[i][0]
                np_start = i
                i += 1
            
            # Look for adjectives
            while i < len(pos_tags) and pos_tags[i][1] in ['JJ', 'JJR', 'JJS']:
                np_components['adjectives'].append({
                    'word': pos_tags[i][0],
                    'type': 'adjective',
                    'degree': pos_tags[i][1]
                })
                if np_start is None:
                    np_start = i
                i += 1
            
            # Look for noun
            if i < len(pos_tags) and pos_tags[i][1] in ['NN', 'NNS', 'NNP', 'NNPS', 'PRP']:
                np_components['noun'] = {
                    'word': pos_tags[i][0],
                    'type': pos_tags[i][1]
                }
                if np_start is None:
                    np_start = i
                i += 1
                
                # Look for post-nominal modifiers (PP, relative clauses)
                while i < len(pos_tags) and pos_tags[i][1] in ['IN', 'VBG', 'VBN']:
                    np_components['post_modifiers'].append(pos_tags[i][0])
                    i += 1
                
                if np_start is not None:
                    np_text = ' '.join([tag[0] for tag in pos_tags[np_start:i]])
                    noun_phrases.append({
                        'text': np_text,
                        'start_index': np_start,
                        'end_index': i,
                        'structure': np_components,
                        'head': np_components['noun']['word'] if np_components['noun'] else None,
                        'complexity': self._calculate_np_complexity(np_components)
                    })
            else:
                i += 1
        
        return noun_phrases
    
    def _extract_verb_phrases(self, pos_tags: List[Tuple[str, str]]) -> List[Dict[str, Any]]:
        """
        Extract and analyze Verb Phrase (VP) structures.
        
        VP → (Aux*) V (NP) (PP*) (AdvP*)
        """
        verb_phrases = []
        i = 0
        
        while i < len(pos_tags):
            vp_start = None
            vp_components = {
                'auxiliaries': [],
                'main_verb': None,
                'particles': [],
                'complements': []
            }
            
            # Look for auxiliaries
            while i < len(pos_tags) and pos_tags[i][1] in ['MD', 'AUX', 'VBZ', 'VBP', 'VBD']:
                vp_components['auxiliaries'].append({
                    'word': pos_tags[i][0],
                    'type': pos_tags[i][1]
                })
                if vp_start is None:
                    vp_start = i
                i += 1
            
            # Look for main verb
            if i < len(pos_tags) and pos_tags[i][1] in ['VB', 'VBN', 'VBG', 'VBP', 'VBZ', 'VBD']:
                vp_components['main_verb'] = {
                    'word': pos_tags[i][0],
                    'type': pos_tags[i][1],
                    'tense': self._get_verb_tense(pos_tags[i][1])
                }
                if vp_start is None:
                    vp_start = i
                i += 1
                
                # Look for particles
                while i < len(pos_tags) and pos_tags[i][1] in ['RP', 'IN']:
                    vp_components['particles'].append(pos_tags[i][0])
                    i += 1
                
                if vp_start is not None:
                    vp_text = ' '.join([tag[0] for tag in pos_tags[vp_start:i]])
                    verb_phrases.append({
                        'text': vp_text,
                        'start_index': vp_start,
                        'end_index': i,
                        'structure': vp_components,
                        'head': vp_components['main_verb']['word'] if vp_components['main_verb'] else None,
                        'tense': vp_components['main_verb']['tense'] if vp_components['main_verb'] else None,
                        'transitivity': self._estimate_transitivity(vp_components)
                    })
            else:
                i += 1
        
        return verb_phrases
    
    def _analyze_morphemes(self, tokens: List[str]) -> List[Dict[str, Any]]:
        """
        Perform morphemic analysis on tokens.
        Breaks down words into morphemes (prefix, root, suffix).
        """
        morphemic_analysis = []
        
        for token in tokens:
            morphemes = self._decompose_morphemes(token)
            morphemic_analysis.append({
                'word': token,
                'morphemes': morphemes,
                'morpheme_count': len(morphemes),
                'is_complex': len(morphemes) > 1
            })
        
        return morphemic_analysis
    
    def _decompose_morphemes(self, word: str) -> List[Dict[str, str]]:
        """
        Decompose a word into morphemes.
        Uses common English affix patterns.
        """
        morphemes = []
        remaining = word.lower()
        
        # Common prefixes
        prefixes = ['un', 're', 'in', 'im', 'il', 'ir', 'dis', 'mis', 'pre', 'de', 'sub', 'trans', 'over', 'under']
        
        # Common suffixes
        suffixes = [
            ('ing', 'VBL'), ('ed', 'PAST'), ('en', 'PAST'),
            ('s', 'PL'), ('es', 'PL'), ('ies', 'PL'),
            ('ly', 'ADV'), ('ness', 'N'), ('ment', 'N'),
            ('tion', 'N'), ('sion', 'N'), ('ity', 'N'),
            ('able', 'ADJ'), ('ible', 'ADJ'), ('ful', 'ADJ'),
            ('less', 'ADJ'), ('ous', 'ADJ'), ('ive', 'ADJ'),
            ('al', 'ADJ'), ('ic', 'ADJ'), ('y', 'ADJ')
        ]
        
        # Check for prefixes
        for prefix in prefixes:
            if remaining.startswith(prefix) and len(remaining) > len(prefix) + 2:
                morphemes.append({'morpheme': prefix, 'type': 'PREFIX'})
                remaining = remaining[len(prefix):]
                break
        
        # Check for suffixes
        for suffix, pos in sorted(suffixes, key=lambda x: len(x[0]), reverse=True):
            if remaining.endswith(suffix) and len(remaining) > len(suffix) + 1:
                morphemes.append({'morpheme': suffix, 'type': f'SUFFIX_{pos}'})
                remaining = remaining[:-len(suffix)]
                break
        
        # Remaining is the root
        if remaining:
            morphemes.append({'morpheme': remaining, 'type': 'ROOT'})
        
        return morphemes
    
    def _detect_ambiguities(self, text: str, pos_tags: List[Tuple[str, str]]) -> List[Dict[str, Any]]:
        """
        Detect structural ambiguities in the text.
        Types: lexical, syntactic, scope, attachment
        """
        ambiguities = []
        
        # Lexical ambiguity (words with multiple POS)
        pos_by_word = defaultdict(set)
        for word, pos in pos_tags:
            pos_by_word[word.lower()].add(pos)
        
        for word, positions in pos_by_word.items():
            if len(positions) > 1:
                ambiguities.append({
                    'type': 'LEXICAL',
                    'word': word,
                    'positions': list(positions),
                    'description': f"'{word}' can function as multiple parts of speech"
                })
        
        # Prepositional phrase attachment ambiguity
        for i, (word, pos) in enumerate(pos_tags):
            if pos == 'IN' and i > 0:
                # Check if PP could attach to multiple heads
                prev_word, prev_pos = pos_tags[i-1]
                if prev_pos in ['VB', 'VBD', 'VBG', 'VBN', 'NN', 'NNS']:
                    ambiguities.append({
                        'type': 'ATTACHMENT',
                        'position': i,
                        'phrase': f"{prev_word} {word} ...",
                        'description': f"PP starting with '{word}' may attach to multiple constituents"
                    })
        
        # Coordination ambiguity
        for i, (word, pos) in enumerate(pos_tags):
            if pos == 'CC' and i > 0 and i < len(pos_tags) - 1:
                prev_pos = pos_tags[i-1][1]
                next_pos = pos_tags[i+1][1]
                if prev_pos == next_pos:
                    ambiguities.append({
                        'type': 'COORDINATION',
                        'position': i,
                        'coordinator': word,
                        'description': f"Coordination with '{word}' creates potential scope ambiguity"
                    })
        
        return ambiguities
    
    def _build_syntactic_tree(self, pos_tags: List[Tuple[str, str]]) -> Dict[str, Any]:
        """
        Build a hierarchical syntactic tree representation.
        """
        # Simplified tree builder
        tree = {
            'type': 'S',
            'label': 'Sentence',
            'children': []
        }
        
        # Group into NP and VP
        current_np = None
        current_vp = None
        
        for i, (word, pos) in enumerate(pos_tags):
            if pos in ['DT', 'JJ', 'NN', 'NNS', 'NNP', 'PRP']:
                if current_vp:
                    tree['children'].append(current_vp)
                    current_vp = None
                if not current_np:
                    current_np = {'type': 'NP', 'label': 'Noun Phrase', 'words': []}
                current_np['words'].append({'word': word, 'pos': pos})
            elif pos in ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'MD', 'AUX']:
                if current_np:
                    tree['children'].append(current_np)
                    current_np = None
                if not current_vp:
                    current_vp = {'type': 'VP', 'label': 'Verb Phrase', 'words': []}
                current_vp['words'].append({'word': word, 'pos': pos})
            else:
                if current_np:
                    tree['children'].append(current_np)
                    current_np = None
                if current_vp:
                    tree['children'].append(current_vp)
                    current_vp = None
                tree['children'].append({'type': pos, 'label': pos, 'words': [{'word': word, 'pos': pos}]})
        
        # Add remaining
        if current_np:
            tree['children'].append(current_np)
        if current_vp:
            tree['children'].append(current_vp)
        
        return tree
    
    def _calculate_np_complexity(self, np_components: Dict) -> str:
        """Calculate complexity level of NP structure."""
        score = 0
        if np_components['determiner']:
            score += 1
        score += len(np_components['adjectives'])
        if np_components['noun']:
            score += 1
        score += len(np_components['post_modifiers'])
        
        if score <= 2:
            return 'SIMPLE'
        elif score <= 4:
            return 'MODERATE'
        else:
            return 'COMPLEX'
    
    def _get_verb_tense(self, pos_tag: str) -> str:
        """Determine verb tense from POS tag."""
        tense_map = {
            'VB': 'BASE',
            'VBD': 'PAST',
            'VBG': 'PROGRESSIVE',
            'VBN': 'PAST_PARTICIPLE',
            'VBP': 'PRESENT',
            'VBZ': 'PRESENT_3SG'
        }
        return tense_map.get(pos_tag, 'UNKNOWN')
    
    def _estimate_transitivity(self, vp_components: Dict) -> str:
        """Estimate verb transitivity."""
        # Simplified estimation
        if vp_components['particles']:
            return 'PHRASAL'
        return 'UNKNOWN'


# Convenience function
def analyze_syntax(text: str) -> Dict[str, Any]:
    """
    Quick function to analyze syntax of a text.
    
    Args:
        text: Input text
        
    Returns:
        Syntactic analysis dictionary
    """
    analyzer = ChomskyanSyntaxAnalyzer()
    return analyzer.analyze(text)


if __name__ == '__main__':
    # Test the syntactic analyzer
    test_text = "The quick brown fox jumps over the lazy dog."
    result = analyze_syntax(test_text)
    
    print(f"Input: {result['text']}")
    print(f"\nNoun Phrases: {len(result['noun_phrases'])}")
    for np in result['noun_phrases']:
        print(f"  [{np['complexity']}] {np['text']} (head: {np['head']})")
    
    print(f"\nVerb Phrases: {len(result['verb_phrases'])}")
    for vp in result['verb_phrases']:
        print(f"  {vp['text']} (tense: {vp['tense']})")
    
    print(f"\nAmbiguities: {len(result['ambiguities'])}")
    for amb in result['ambiguities']:
        print(f"  [{amb['type']}] {amb['description']}")
