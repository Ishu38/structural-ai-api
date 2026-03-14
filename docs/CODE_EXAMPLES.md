# Structural AI API - Code Examples

This document provides copy-and-paste code examples for integrating the Structural AI API into your applications.

## Table of Contents

1. [Authentication](#authentication)
2. [Text Analysis](#text-analysis)
3. [Audio Analysis](#audio-analysis)
4. [Batch Processing](#batch-processing)
5. [Usage Tracking](#usage-tracking)

---

## Authentication

### Python

```python
import requests

BASE_URL = "https://api.structuralai.app/v1"

# Register a new user
def register(email, password, name, company=None):
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "name": name,
        "company": company
    })
    return response.json()

# Login and get API key
def login(email, password):
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    data = response.json()
    return data.get("user", {}).get("apiKey")

# Usage
api_key = login("user@example.com", "SecurePass123!")
print(f"Your API key: {api_key}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://api.structuralai.app/v1';

// Register a new user
async function register(email, password, name, company = null) {
  const response = await axios.post(`${BASE_URL}/auth/register`, {
    email,
    password,
    name,
    company
  });
  return response.data;
}

// Login and get API key
async function login(email, password) {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    password
  });
  return response.data.user.apiKey;
}

// Usage
(async () => {
  const apiKey = await login('user@example.com', 'SecurePass123!');
  console.log(`Your API key: ${apiKey}`);
})();
```

### cURL

```bash
# Register
curl -X POST https://api.structuralai.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "company": "Acme Research"
  }'

# Login
curl -X POST https://api.structuralai.app/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Text Analysis

### Python

```python
import requests

BASE_URL = "https://api.structuralai.app/v1"
API_KEY = "your-api-key-here"

def analyze_text(text, include_morphemes=True, detect_ambiguities=True):
    """
    Analyze text for deep syntactic structure.
    
    Returns:
        dict: Analysis result with NP/VP structures, morphemes, and ambiguities
    """
    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": text,
        "options": {
            "includeMorphemes": include_morphemes,
            "detectAmbiguities": detect_ambiguities
        }
    }
    
    response = requests.post(f"{BASE_URL}/analyze/text", headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

# Example usage
if __name__ == "__main__":
    text = "The quick brown fox jumps over the lazy dog."
    
    result = analyze_text(text)
    
    print(f"Status: {result['status']}")
    print(f"Processing time: {result['processingTimeMs']}ms")
    print(f"Tokens: {result['result']['metadata']['tokenCount']}")
    print(f"Noun phrases: {result['result']['metadata']['npCount']}")
    print(f"Verb phrases: {result['result']['metadata']['vpCount']}")
    print(f"Ambiguities: {result['result']['metadata']['ambiguityCount']}")
    
    # Print noun phrases
    print("\nNoun Phrases:")
    for np in result['result']['syntactic']['noun_phrases']:
        print(f"  - {np['text']} (complexity: {np['complexity']})")
    
    # Print verb phrases
    print("\nVerb Phrases:")
    for vp in result['result']['syntactic']['verb_phrases']:
        print(f"  - {vp['text']} (tense: {vp['tense']})")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://api.structuralai.app/v1';
const API_KEY = 'your-api-key-here';

async function analyzeText(text, options = {}) {
  /**
   * Analyze text for deep syntactic structure.
   * 
   * @param {string} text - Text to analyze
   * @param {object} options - Analysis options
   * @returns {Promise<object>} Analysis result
   */
  const response = await axios.post(
    `${BASE_URL}/analyze/text`,
    {
      text,
      options: {
        includeMorphemes: options.includeMorphemes ?? true,
        detectAmbiguities: options.detectAmbiguities ?? true
      }
    },
    {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// Example usage
(async () => {
  const text = "The quick brown fox jumps over the lazy dog.";
  
  const result = await analyzeText(text);
  
  console.log(`Status: ${result.status}`);
  console.log(`Processing time: ${result.processingTimeMs}ms`);
  console.log(`Tokens: ${result.result.metadata.tokenCount}`);
  console.log(`Noun phrases: ${result.result.metadata.npCount}`);
  console.log(`Verb phrases: ${result.result.metadata.vpCount}`);
  
  console.log('\nNoun Phrases:');
  result.result.syntactic.noun_phrases.forEach(np => {
    console.log(`  - ${np.text} (complexity: ${np.complexity})`);
  });
  
  console.log('\nVerb Phrases:');
  result.result.syntactic.verb_phrases.forEach(vp => {
    console.log(`  - ${vp.text} (tense: ${vp.tense})`);
  });
})();
```

### cURL

```bash
curl -X POST https://api.structuralai.app/v1/analyze/text \
  -H "x-api-key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog.",
    "options": {
      "includeMorphemes": true,
      "detectAmbiguities": true
    }
  }'
```

---

## Audio Analysis

### Python

```python
import requests

BASE_URL = "https://api.structuralai.app/v1"
API_KEY = "your-api-key-here"

def analyze_audio(audio_path, language="en"):
    """
    Analyze audio file: transcribe + syntactic analysis.
    
    Args:
        audio_path: Path to audio file (wav, mp3, ogg, webm, flac, m4a)
        language: Source language code (auto-detect if None)
    
    Returns:
        dict: Transcription and syntactic analysis
    """
    headers = {
        "x-api-key": API_KEY
    }
    
    files = {
        "audio": open(audio_path, "rb")
    }
    
    data = {
        "language": language
    }
    
    response = requests.post(
        f"{BASE_URL}/analyze/audio",
        headers=headers,
        files=files,
        data=data
    )
    response.raise_for_status()
    return response.json()

# Example usage
if __name__ == "__main__":
    result = analyze_audio("speech.wav")
    
    print(f"Transcription: {result['result']['acoustic']['transcription']}")
    print(f"Language: {result['result']['acoustic']['language']}")
    print(f"Duration: {result['result']['acoustic']['duration']:.2f}s")
    print(f"Tokens: {result['result']['metadata']['tokenCount']}")
    print(f"Billable minutes: {result['billing']['audioMinutes']}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'https://api.structuralai.app/v1';
const API_KEY = 'your-api-key-here';

async function analyzeAudio(audioPath, language = 'en') {
  /**
   * Analyze audio file: transcribe + syntactic analysis.
   * 
   * @param {string} audioPath - Path to audio file
   * @param {string} language - Source language code
   * @returns {Promise<object>} Analysis result
   */
  const form = new FormData();
  form.append('audio', fs.createReadStream(audioPath));
  form.append('language', language);
  
  const response = await axios.post(
    `${BASE_URL}/analyze/audio`,
    form,
    {
      headers: {
        'x-api-key': API_KEY,
        ...form.getHeaders()
      }
    }
  );
  
  return response.data;
}

// Example usage
(async () => {
  const result = await analyzeAudio('speech.wav');
  
  console.log(`Transcription: ${result.result.acoustic.transcription}`);
  console.log(`Language: ${result.result.acoustic.language}`);
  console.log(`Duration: ${result.result.acoustic.duration.toFixed(2)}s`);
  console.log(`Billable minutes: ${result.billing.audioMinutes}`);
})();
```

### cURL

```bash
curl -X POST https://api.structuralai.app/v1/analyze/audio \
  -H "x-api-key: your-api-key-here" \
  -F "audio=@speech.wav" \
  -F "language=en"
```

---

## Batch Processing

### Python

```python
import requests
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "https://api.structuralai.app/v1"
API_KEY = "your-api-key-here"

def analyze_batch(texts, max_workers=5):
    """
    Analyze multiple texts in parallel.
    
    Args:
        texts: List of texts to analyze
        max_workers: Maximum concurrent requests
    
    Returns:
        list: Analysis results
    """
    headers = {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    def analyze_single(text):
        response = requests.post(
            f"{BASE_URL}/analyze/text",
            headers=headers,
            json={"text": text}
        )
        return response.json()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = list(executor.map(analyze_single, texts))
    
    return results

# Example usage
if __name__ == "__main__":
    texts = [
        "The cat sat on the mat.",
        "Quick brown fox jumps over the lazy dog.",
        "Linguistics is the scientific study of language."
    ]
    
    results = analyze_batch(texts)
    
    for i, result in enumerate(results):
        print(f"\nText {i+1}:")
        print(f"  NPs: {result['result']['metadata']['npCount']}")
        print(f"  VPs: {result['result']['metadata']['vpCount']}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://api.structuralai.app/v1';
const API_KEY = 'your-api-key-here';

async function analyzeBatch(texts, concurrency = 5) {
  /**
   * Analyze multiple texts with controlled concurrency.
   * 
   * @param {string[]} texts - Texts to analyze
   * @param {number} concurrency - Maximum concurrent requests
   * @returns {Promise<object[]>} Analysis results
   */
  const headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  };
  
  async function analyzeSingle(text) {
    const response = await axios.post(
      `${BASE_URL}/analyze/text`,
      { text },
      { headers }
    );
    return response.data;
  }
  
  // Process with concurrency limit
  const results = [];
  const inProgress = new Set();
  let index = 0;
  
  return new Promise((resolve) => {
    function processNext() {
      while (inProgress.size < concurrency && index < texts.length) {
        const currentIndex = index++;
        const promise = analyzeSingle(texts[currentIndex])
          .then(result => {
            results[currentIndex] = result;
          })
          .finally(() => {
            inProgress.delete(promise);
            processNext();
          });
        
        inProgress.add(promise);
      }
      
      if (inProgress.size === 0 && index >= texts.length) {
        resolve(results);
      }
    }
    
    processNext();
  });
}

// Example usage
(async () => {
  const texts = [
    "The cat sat on the mat.",
    "Quick brown fox jumps over the lazy dog.",
    "Linguistics is the scientific study of language."
  ];
  
  const results = await analyzeBatch(texts);
  
  results.forEach((result, i) => {
    console.log(`\nText ${i+1}:`);
    console.log(`  NPs: ${result.result.metadata.npCount}`);
    console.log(`  VPs: ${result.result.metadata.vpCount}`);
  });
})();
```

---

## Usage Tracking

### Python

```python
import requests

BASE_URL = "https://api.structuralai.app/v1"
API_KEY = "your-api-key-here"

def get_usage():
    """Get current billing period usage."""
    headers = {"x-api-key": API_KEY}
    response = requests.get(f"{BASE_URL}/billing/usage", headers=headers)
    return response.json()

def get_plans():
    """Get available pricing plans."""
    headers = {"x-api-key": API_KEY}
    response = requests.get(f"{BASE_URL}/billing/plans", headers=headers)
    return response.json()

# Example usage
if __name__ == "__main__":
    usage = get_usage()
    
    print(f"Plan: {usage['plan']['name']} (${usage['plan']['price']})")
    print(f"Period: {usage['period']['start']} to {usage['period']['end']}")
    print(f"\nUsage:")
    print(f"  Total requests: {usage['usage']['totalRequests']}")
    print(f"  Total tokens: {usage['usage']['totalTokens']:,}")
    print(f"  Audio minutes: {usage['usage']['totalAudioMinutes']}")
    print(f"\nBilling:")
    print(f"  Base price: ${usage['billing']['basePrice']}")
    print(f"  Overage: ${usage['billing']['overageCost']}")
    print(f"  Estimated total: ${usage['billing']['estimatedTotal']}")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'https://api.structuralai.app/v1';
const API_KEY = 'your-api-key-here';

async function getUsage() {
  const response = await axios.get(`${BASE_URL}/billing/usage`, {
    headers: { 'x-api-key': API_KEY }
  });
  return response.data;
}

async function getPlans() {
  const response = await axios.get(`${BASE_URL}/billing/plans`, {
    headers: { 'x-api-key': API_KEY }
  });
  return response.data;
}

// Example usage
(async () => {
  const usage = await getUsage();
  
  console.log(`Plan: ${usage.plan.name} ($${usage.plan.price})`);
  console.log(`Period: ${usage.period.start} to ${usage.period.end}`);
  console.log('\nUsage:');
  console.log(`  Total requests: ${usage.usage.totalRequests}`);
  console.log(`  Total tokens: ${usage.usage.totalTokens.toLocaleString()}`);
  console.log(`  Audio minutes: ${usage.usage.totalAudioMinutes}`);
  console.log('\nBilling:');
  console.log(`  Base price: $${usage.billing.basePrice}`);
  console.log(`  Overage: $${usage.billing.overageCost}`);
  console.log(`  Estimated total: $${usage.billing.estimatedTotal}`);
})();
```

---

## Error Handling

### Python

```python
import requests
from requests.exceptions import HTTPError, Timeout, ConnectionError

def safe_analyze_text(text):
    headers = {"x-api-key": API_KEY}
    
    try:
        response = requests.post(
            f"{BASE_URL}/analyze/text",
            headers=headers,
            json={"text": text},
            timeout=120
        )
        response.raise_for_status()
        return response.json()
    
    except HTTPError as e:
        if e.response.status_code == 429:
            print("Rate limit exceeded. Please wait and retry.")
        elif e.response.status_code == 401:
            print("Invalid API key.")
        elif e.response.status_code == 400:
            print("Invalid input text.")
        else:
            print(f"HTTP error: {e.response.status_code}")
        return None
    
    except Timeout:
        print("Request timed out. Try again.")
        return None
    
    except ConnectionError:
        print("Connection error. Check your internet.")
        return None
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function safeAnalyzeText(text) {
  try {
    const response = await axios.post(
      `${BASE_URL}/analyze/text`,
      { text },
      {
        headers: { 'x-api-key': API_KEY },
        timeout: 120000
      }
    );
    return response.data;
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        console.log('Rate limit exceeded. Please wait and retry.');
      } else if (status === 401) {
        console.log('Invalid API key.');
      } else if (status === 400) {
        console.log('Invalid input text.');
      } else {
        console.log(`HTTP error: ${status}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.log('Request timed out. Try again.');
    } else if (error.code === 'ECONNRESET') {
      console.log('Connection error. Check your internet.');
    } else {
      console.log(`Error: ${error.message}`);
    }
    return null;
  }
}
```

---

## Support

For more help:
- API Documentation: https://docs.structuralai.app
- Email: support@structuralai.app
- GitHub: https://github.com/structural-ai/api
