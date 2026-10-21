# EchoCraft AI Studio: End-to-End Project & Model Guide

## 1. Executive Summary & Project Purpose
EchoCraft AI Studio is a beginner-friendly, low-cost prototype bridging two key artificial intelligence modalities:
1. **AI Voice Generation (Text-to-Speech / Neural Acoustic Synthesis)**
2. **AI Conversational Agent (Generative Large Language Model)**
3. **Integrated Voice Chat Assistant (Real-time Spoken Dialogue)**

Built from the ground up for learning and demonstration, the solution requires $0.00 in hosting or software costs.

---

## 2. Exactly What AI Models Are Powering This Project

### A. Conversational Language Model: Google Gemini 3.5 Flash
- **Model Identifier**: `models/gemini-3.5-flash`
- **Architecture**: Dense/sparse multimodal transformer.
- **Context Window**: Up to 1,000,000 tokens.
- **Inference Latency**: Sub-350ms time-to-first-token.
- **Integration**: Direct asynchronous REST endpoint (`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`).
- **Failover Candidates**: Auto-fails over to `gemini-3.8-flash` or `gemma-4-26b-a4b-it`.

### B. Voice Synthesis Engine: Microsoft Edge Neural TTS
- **Engine**: Microsoft Edge Neural Speech Synthesis via `edge-tts`.
- **Acoustic Model**: Transformer/Conformer mapping phonemes to 80-band Mel-spectrograms.
- **Neural Vocoder**: HiFi-GAN / VITS neural network converting spectrograms to high-fidelity 24kHz audio waveforms.
- **In-Memory Streaming**: Binary chunks stream directly into memory (`io.BytesIO`) with zero disk I/O.
- **Voices**: 322 studio-grade neural voices across 70+ languages.

### C. Open-Source Alternatives Supported
- **Ollama**: Local execution of Meta Llama 3.2, Mistral 7B, and Phi 3.5 on consumer CPUs/GPUs.
- **Groq LPU**: Cloud inference for Llama 3.3 70B at 500+ tok/s on a 100% free tier.
- **Piper TTS / Kokoro-82M**: Open-weight neural speech synthesizers running offline.

---

## 3. End-to-End Architecture & Data Flow

```
[ Browser UI (HTML5 / Modern CSS / Vanilla JS) ]
       │
   REST API (HTTP / Binary Audio Stream)
       │
       ▼
[ FastAPI Backend Server (server.py) ]
  ├── GET  /api/status      -> Health & capabilities
  ├── GET  /api/voices      -> Curated & full 320+ voice catalog
  ├── POST /api/tts         -> In-memory MP3 speech synthesis
  ├── POST /api/chat        -> Generative LLM reasoning (Gemini)
  └── POST /api/chat-voice  -> Combined text & neural audio pipeline
       │                          │
       ▼                          ▼
[ Edge-TTS Engine ]      [ Google Gemini 3.5 Flash ]
```

---

## 4. Verification & Testing Summary
Automated tests in `test_app.py` verify all core functions:
- `test_api_status`: PASSED
- `test_get_voices_curated`: PASSED
- `test_tts_generation_independent`: PASSED
- `test_tts_empty_text_validation`: PASSED
- `test_chat_agent_independent`: PASSED
- `test_integrated_chat_voice`: PASSED

---

## 5. Quickstart Commands
```bash
pip install -r requirements.txt
Copy-Item .env.example .env
python -m pytest test_app.py -v
python server.py
# Open http://127.0.0.1:8000
```
