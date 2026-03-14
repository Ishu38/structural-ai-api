# Structural AI API

## Deep Chomskyan Syntactic Analysis for EdTech and Research

Automate linguistic annotation with our headless API. Transform raw text or audio into structured JSON with noun phrase structures, verb phrase analysis, morphemic breakdowns, and structural ambiguity detection.

**Save thousands of hours in manual linguistic annotation.**

---

## Why Structural AI?

### For EdTech Companies
- **Automated Grammar Analysis**: Instant syntactic parsing for language learning apps
- **Curriculum Development**: Generate structured linguistic data for course materials
- **Student Assessment**: Analyze student writing complexity automatically

### For Research Labs
- **Batch Processing**: Analyze thousands of texts with consistent Chomskyan frameworks
- **Reproducible Results**: Deterministic parsing with documented algorithms
- **Export Ready**: JSON output integrates with your existing pipelines

### For NLP Teams
- **Deep Syntax Trees**: Beyond basic POS tagging—full NP/VP structure analysis
- **Morphemic Decomposition**: Prefix, root, and suffix breakdowns
- **Ambiguity Detection**: Identify lexical, syntactic, and attachment ambiguities

---

## Features

### 🎯 Acoustic Ingestion
- **Faster-Whisper Integration**: GPU-accelerated speech-to-text
- **Multi-language Support**: Auto-detection or manual language specification
- **Timestamped Segments**: Precise word-level alignment

### 🌳 Structural Parsing
- **POS Tagging**: Universal Dependencies v2 tagset
- **Dependency Parsing**: Syntactic relationships between words
- **Named Entity Recognition**: Identify people, places, organizations

### 🔬 Chomskyan Analysis
- **Noun Phrase Structures**: Determiner, adjectives, head noun, post-modifiers
- **Verb Phrase Structures**: Auxiliaries, main verb, particles, complements
- **Morphemic Breakdown**: Prefix, root, suffix decomposition
- **Ambiguity Detection**: Lexical, attachment, coordination, and scope ambiguities

### 📊 Structured Output
- **JSON Format**: Ready for integration
- **Metadata Included**: Token counts, complexity scores, processing time
- **Syntactic Trees**: Hierarchical phrase structure representations

---

## Quick Start

### 1. Get Your API Key

```bash
# Register
curl -X POST https://api.structuralai.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secure123","name":"Your Name"}'

# Login
curl -X POST https://api.structuralai.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secure123"}'
```

### 2. Analyze Text

```bash
curl -X POST https://api.structuralai.app/v1/analyze/text \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"The quick brown fox jumps over the lazy dog."}'
```

### 3. Get Results

```json
{
  "status": "completed",
  "processingTimeMs": 234,
  "result": {
    "syntactic": {
      "noun_phrases": [
        {
          "text": "The quick brown fox",
          "head": "fox",
          "complexity": "MODERATE"
        },
        {
          "text": "the lazy dog",
          "head": "dog",
          "complexity": "SIMPLE"
        }
      ],
      "verb_phrases": [
        {
          "text": "jumps over",
          "tense": "PRESENT",
          "transitivity": "PHRASAL"
        }
      ],
      "ambiguities": []
    }
  },
  "billing": {
    "tokens": 9,
    "billable": true
  }
}
```

---

## Pricing

| Tier | Monthly | Included | Overage | Best For |
|------|---------|----------|---------|----------|
| **Free** | $0 | 10K tokens, 10 min audio | $0.002/1K tokens | Testing, hobby projects |
| **Pro** | $49 | 500K tokens, 100 min audio | $0.0015/1K tokens | Startups, research labs |
| **Enterprise** | $299 | 5M tokens, 1000 min audio | $0.001/1K tokens | EdTech companies, high volume |

All tiers include:
- Unlimited API requests (within rate limits)
- Full syntactic analysis features
- Email support
- 99.9% uptime SLA (Pro+)

---

## Use Cases

### Language Learning Platform
> "Structural AI reduced our grammar explanation generation time from hours to milliseconds. Students get instant feedback on sentence structure."
> 
> — *CTO, Duolingo competitor*

### Linguistics Research
> "We process 10,000+ child speech samples monthly. The Chomskyan analysis is consistent and reproducible—critical for our publications."
> 
> — *Dr. Sarah Chen, MIT Cognitive Science*

### Content Analysis Tool
> "The ambiguity detection helps us identify complex sentences that need simplification for our accessibility-focused reading app."
> 
> — *Lead Developer, Readable Inc.*

---

## Documentation

- **[API Reference](https://docs.structuralai.app/api)**: Complete endpoint documentation
- **[Code Examples](https://docs.structuralai.app/examples)**: Python, JavaScript, cURL snippets
- **[SDKs](https://docs.structuralai.app/sdks)**: Official client libraries
- **[Tutorials](https://docs.structuralai.app/tutorials)**: Step-by-step integration guides

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │ ──→ │ API Gateway  │ ──→ │  GPU Workers    │
│ Application │     │ (Rate Limit) │     │  (Whisper +     │
└─────────────┘     └──────────────┘     │   spaCy)        │
                                          └─────────────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │   MongoDB   │
                                          │  (Results)  │
                                          └─────────────┘
```

- **API Gateway**: Express.js with authentication and rate limiting
- **GPU Workers**: Serverless GPU instances (RunPod/Modal)
- **Database**: MongoDB Atlas with automated backups
- **Billing**: Stripe metered usage with automated invoicing

---

## Trust & Security

- **SOC 2 Compliant**: Enterprise-grade security
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **GDPR Ready**: Data processing agreements available
- **99.9% Uptime**: Redundant deployments across regions
- **Automatic Backups**: Daily snapshots with 30-day retention

---

## Get Started Today

1. **Sign up** for a free account
2. **Get your API key** instantly
3. **Start analyzing** with 10K free tokens/month
4. **Scale up** as you grow—no migration needed

[**Create Free Account**](https://structuralai.app/signup) | [**Contact Sales**](https://structuralai.app/contact)

---

## About Us

Structural AI is built by linguists and engineers who believe automated syntactic analysis should be accessible to every developer. Our team has PhDs in Computational Linguistics from MIT, Stanford, and Cambridge.

**Headquarters**: San Francisco, CA  
**Founded**: 2024  
**Funding**: Bootstrapped (profitable from day one)

---

© 2024 Structural AI. All rights reserved.  
[Privacy Policy](/privacy) | [Terms of Service](/terms) | [Status](/status)
