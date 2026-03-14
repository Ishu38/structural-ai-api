"""
Engine module initialization
"""
# Lazy imports to avoid circular dependency issues
__all__ = ['StructuralAIPipeline', 'analyze']

def __getattr__(name):
    if name == 'StructuralAIPipeline':
        from .pipeline import StructuralAIPipeline
        return StructuralAIPipeline
    elif name == 'analyze':
        from .pipeline import analyze
        return analyze
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
