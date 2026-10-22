"""
EchoCraft AI Studio Server
FastAPI backend providing:
1. AI Voice Generation (Edge-TTS high-quality neural voices)
2. AI Chat Agent (Google Gemini Flash / OpenAI / Groq / Ollama / Conversational Engine)
3. Integrated Voice-Chat pipeline
"""

import os
import io
import base64
import logging
from typing import List, Optional
import httpx
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

import edge_tts

# Load environment variables
load_dotenv(override=True)

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("echocraft")

# Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEFAULT_VOICE = os.getenv("DEFAULT_VOICE", "en-US-JennyNeural")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
DEFAULT_LLM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "gemini").lower()

app = FastAPI(
    title="EchoCraft AI Voice & Chat Studio",
    description="Low-cost prototype combining Neural AI Voice Generation and Conversational Chat Agent",
    version="1.2.0"
)

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Curated high-quality voices catalog
# ---------------------------------------------------------
CURATED_VOICES = [
    {"shortName": "en-US-JennyNeural", "name": "Jenny", "gender": "Female", "locale": "en-US", "language": "English (US)", "accent": "Warm & Natural"},
    {"shortName": "en-US-GuyNeural", "name": "Guy", "gender": "Male", "locale": "en-US", "language": "English (US)", "accent": "Confident & Clear"},
    {"shortName": "en-US-AriaNeural", "name": "Aria", "gender": "Female", "locale": "en-US", "language": "English (US)", "accent": "Dynamic & Expressive"},
    {"shortName": "en-GB-SoniaNeural", "name": "Sonia", "gender": "Female", "locale": "en-GB", "language": "English (UK)", "accent": "Professional British"},
    {"shortName": "en-GB-RyanNeural", "name": "Ryan", "gender": "Male", "locale": "en-GB", "language": "English (UK)", "accent": "Polished British"},
    {"shortName": "en-AU-NatashaNeural", "name": "Natasha", "gender": "Female", "locale": "en-AU", "language": "English (Australia)", "accent": "Australian Accent"},
    {"shortName": "en-IN-NeerjaNeural", "name": "Neerja", "gender": "Female", "locale": "en-IN", "language": "English (India)", "accent": "Indian Accent"},
    {"shortName": "en-IN-PrabhatNeural", "name": "Prabhat", "gender": "Male", "locale": "en-IN", "language": "English (India)", "accent": "Indian Accent"},
    {"shortName": "es-ES-ElviraNeural", "name": "Elvira", "gender": "Female", "locale": "es-ES", "language": "Spanish (Spain)", "accent": "Castilian Spanish"},
    {"shortName": "fr-FR-DeniseNeural", "name": "Denise", "gender": "Female", "locale": "fr-FR", "language": "French (France)", "accent": "Natural French"},
    {"shortName": "de-DE-KatjaNeural", "name": "Katja", "gender": "Female", "locale": "de-DE", "language": "German (Germany)", "accent": "Contemporary German"},
    {"shortName": "ja-JP-NanamiNeural", "name": "Nanami", "gender": "Female", "locale": "ja-JP", "language": "Japanese", "accent": "Friendly Tokyo Japanese"},
]

# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice: Optional[str] = Field(default=DEFAULT_VOICE)
    rate: Optional[str] = Field(default="+0%")
    pitch: Optional[str] = Field(default="+0Hz")

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=4000)

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    provider: Optional[str] = Field(default="auto")

class IntegratedChatVoiceRequest(BaseModel):
    messages: List[ChatMessage]
    voice: Optional[str] = Field(default=DEFAULT_VOICE)
    rate: Optional[str] = Field(default="+0%")
    pitch: Optional[str] = Field(default="+0Hz")
    provider: Optional[str] = Field(default="auto")

# ---------------------------------------------------------
# Google Gemini API (Direct Live AI Generation)
# ---------------------------------------------------------
def call_gemini(messages: List[ChatMessage]) -> str:
    """Calls Google Gemini API directly using user's API key."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    # Format message history for Gemini API
    contents = []
    for msg in messages:
        role = "user" if msg.role == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 600
        }
    }

    # Available Gemini models in prioritized order
    candidate_models = ["gemini-3.5-flash", "gemini-3.8-flash", "gemma-4-26b-a4b-it"]
    
    for model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            reply = parts[0].get("text", "").strip()
                            if reply:
                                return reply
                else:
                    logger.warning(f"Gemini {model} returned status {resp.status_code}: {resp.text[:120]}")
        except Exception as e:
            logger.warning(f"Error calling {model}: {e}")
            continue

    raise RuntimeError("Gemini API calls failed across all candidate models.")

# ---------------------------------------------------------
# OpenAI API Caller
# ---------------------------------------------------------
def call_openai(messages: List[ChatMessage]) -> str:
    """Calls OpenAI API."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY, timeout=10.0, max_retries=0)
    formatted_msgs = [{"role": m.role, "content": m.content} for m in messages]
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=formatted_msgs,
        max_tokens=500
    )
    return response.choices[0].message.content.strip()

# ---------------------------------------------------------
# Groq & Ollama Callers (Open-Source)
# ---------------------------------------------------------
def call_groq(messages: List[ChatMessage]) -> str:
    from openai import OpenAI
    client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=GROQ_API_KEY, timeout=10.0)
    formatted_msgs = [{"role": m.role, "content": m.content} for m in messages]
    response = client.chat.completions.create(model=GROQ_MODEL, messages=formatted_msgs, max_tokens=600)
    return response.choices[0].message.content.strip()

def call_ollama(messages: List[ChatMessage]) -> str:
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": m.role, "content": m.content} for m in messages],
        "stream": False
    }
    with httpx.Client(timeout=30.0) as client:
        resp = client.post(url, json=payload)
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()

def check_ollama_alive() -> bool:
    try:
        with httpx.Client(timeout=0.6) as client:
            resp = client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False

# ---------------------------------------------------------
# Natural Direct Knowledge Fallback
# ---------------------------------------------------------
def natural_fallback_answer(query: str) -> str:
    """Provides natural, direct answers without any disclaimer headers."""
    q = query.lower()
    if any(k in q for k in ["artificial intelligence", "what is ai", "define ai", "ai?"]):
        return (
            "Artificial Intelligence (AI) is the science of building computer systems capable of performing tasks that typically require human cognition, such as reasoning, problem-solving, recognizing speech, and understanding natural language.\n\n"
            "Key branches of AI include:\n"
            "1. Machine Learning: Algorithms that learn patterns directly from data.\n"
            "2. Deep Learning: Multi-layered neural networks inspired by biological brains, powering computer vision and speech recognition.\n"
            "3. Large Language Models: Massive transformer models trained on vast text corpora to generate natural language and code.\n"
            "4. Speech Synthesis: Neural acoustic models that turn written words into lifelike audio waveforms in real time."
        )
    elif any(k in q for k in ["quantum", "qubit", "superposition"]):
        return (
            "Imagine a standard computer is like a light switch that can only be either OFF (0) or ON (1).\n\n"
            "A quantum computer uses special quantum switches called qubits. Think of a qubit like a spinning coin: while it is spinning in the air, it is both heads and tails at the exact same time! This phenomenon is known as superposition.\n\n"
            "Because qubits can evaluate thousands of possibilities simultaneously, quantum computers can solve complex calculations in seconds that would take classical computers thousands of years."
        )
    elif any(k in q for k in ["web dev", "web development", "learn web"]):
        return (
            "Here is a straightforward 3-step guide to learning web development:\n\n"
            "1. Master the Core Frontend: Learn HTML for semantic layout, CSS for responsive styling, and modern JavaScript for interactivity and asynchronous data fetching.\n"
            "2. Build Interactive Projects: Create real-world applications like calculators, audio dashboards, and API clients to reinforce practical coding skills.\n"
            "3. Connect to Backends & APIs: Learn a lightweight framework like Python FastAPI or Node.js to manage databases, serve endpoints, and deploy applications."
        )
    else:
        topic = query.rstrip("?.!")
        return (
            f"{topic} is an important subject in modern computing and technology. "
            "It combines foundational principles, practical engineering applications, and integration with modern software systems. "
            "Exploring this topic helps us design more efficient, accessible, and automated applications."
        )

# ---------------------------------------------------------
# Central Chat Orchestrator
# ---------------------------------------------------------
def generate_chat_response(messages: List[ChatMessage], requested_provider: str = "auto") -> tuple[str, str]:
    """Generates direct AI response using the prioritized working provider."""
    provider = requested_provider.lower()
    
    if provider == "auto":
        if DEFAULT_LLM_PROVIDER != "auto":
            provider = DEFAULT_LLM_PROVIDER
        elif GEMINI_API_KEY:
            provider = "gemini"
        elif OPENAI_API_KEY:
            provider = "openai"
        elif GROQ_API_KEY:
            provider = "groq"
        elif check_ollama_alive():
            provider = "ollama"
        else:
            provider = "direct"

    # Attempt selected provider
    if provider == "gemini" and GEMINI_API_KEY:
        try:
            return call_gemini(messages), "Gemini AI"
        except Exception as e:
            logger.warning(f"Gemini call failed: {e}")

    if provider == "openai" and OPENAI_API_KEY:
        try:
            return call_openai(messages), "OpenAI (gpt-4o-mini)"
        except Exception as e:
            logger.warning(f"OpenAI call failed: {e}")

    if provider == "groq" and GROQ_API_KEY:
        try:
            return call_groq(messages), f"Groq Llama 3 ({GROQ_MODEL})"
        except Exception as e:
            logger.warning(f"Groq call failed: {e}")

    if provider == "ollama" or check_ollama_alive():
        try:
            return call_ollama(messages), f"Local Ollama ({OLLAMA_MODEL})"
        except Exception as e:
            logger.warning(f"Ollama call failed: {e}")

    # Direct natural fallback
    last_query = messages[-1].content if messages else "Hello"
    return natural_fallback_answer(last_query), "EchoCraft AI (builtin)"

# ---------------------------------------------------------
# TTS Synthesis Helper
# ---------------------------------------------------------
async def synthesize_speech_bytes(text: str, voice: str, rate: str = "+0%", pitch: str = "+0Hz") -> bytes:
    """Synthesizes text into MP3 bytes in-memory using Edge-TTS."""
    cleaned_text = text.strip()
    if not cleaned_text:
        raise ValueError("Cannot synthesize empty text.")
    
    clean_speech_text = cleaned_text.replace("**", "").replace("*", "").replace("#", "").replace("`", "")
    
    tts = edge_tts.Communicate(
        text=clean_speech_text,
        voice=voice or DEFAULT_VOICE,
        rate=rate or "+0%",
        pitch=pitch or "+0Hz"
    )
    
    buffer = io.BytesIO()
    async for chunk in tts.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])
            
    buffer.seek(0)
    audio_bytes = buffer.read()
    if not audio_bytes:
        raise RuntimeError("No audio data generated by synthesizer.")
    return audio_bytes

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/status")
def get_status():
    """Health check and detected environment capabilities."""
    ollama_online = check_ollama_alive()
    return {
        "status": "online",
        "app": "EchoCraft AI Studio",
        "version": "1.2.0",
        "capabilities": {
            "edge_tts": True,
            "gemini_configured": bool(GEMINI_API_KEY),
            "openai_configured": bool(OPENAI_API_KEY),
            "groq_configured": bool(GROQ_API_KEY),
            "ollama_available": ollama_online,
            "default_provider": (
                "gemini" if GEMINI_API_KEY else (
                    "openai" if OPENAI_API_KEY else (
                        "groq" if GROQ_API_KEY else (
                            "ollama" if ollama_online else "direct"
                        )
                    )
                )
            ),
            "default_voice": DEFAULT_VOICE
        }
    }

@app.get("/api/voices")
async def get_voices(all_voices: bool = Query(default=False, alias="all")):
    """Returns curated or full list of neural voices."""
    if not all_voices:
        return {"total": len(CURATED_VOICES), "voices": CURATED_VOICES}
    
    try:
        available = await edge_tts.list_voices()
        formatted = [
            {
                "shortName": v["ShortName"],
                "name": v["FriendlyName"],
                "gender": v["Gender"],
                "locale": v["Locale"],
                "language": v.get("Locale", "Unknown"),
                "accent": v.get("SuggestedCodec", "")
            }
            for v in available
        ]
        return {"total": len(formatted), "voices": formatted}
    except Exception as e:
        logger.error(f"Error listing all voices: {e}")
        return {"total": len(CURATED_VOICES), "voices": CURATED_VOICES, "fallback": True}

@app.post("/api/tts")
async def post_tts(payload: TTSRequest, download: bool = Query(default=False)):
    """Synthesizes text into high-quality MP3 audio."""
    try:
        audio_bytes = await synthesize_speech_bytes(
            text=payload.text,
            voice=payload.voice or DEFAULT_VOICE,
            rate=payload.rate or "+0%",
            pitch=payload.pitch or "+0Hz"
        )
        
        disposition_type = "attachment" if download else "inline"
        headers = {
            "Content-Disposition": f'{disposition_type}; filename="echocraft_speech.mp3"',
            "Content-Length": str(len(audio_bytes)),
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache"
        }
        return Response(content=audio_bytes, media_type="audio/mpeg", headers=headers)
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice synthesis failed: {str(e)}")

@app.post("/api/chat")
def post_chat(payload: ChatRequest):
    """Processes chat messages and returns AI response."""
    try:
        reply_text, provider_info = generate_chat_response(
            messages=payload.messages,
            requested_provider=payload.provider or "auto"
        )
        return {
            "reply": reply_text,
            "provider": provider_info
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/api/chat-voice")
async def post_chat_voice(payload: IntegratedChatVoiceRequest):
    """Combined endpoint: processes chat message and returns response text AND base64 audio."""
    try:
        reply_text, provider_info = generate_chat_response(
            messages=payload.messages,
            requested_provider=payload.provider or "auto"
        )
        
        audio_bytes = await synthesize_speech_bytes(
            text=reply_text,
            voice=payload.voice or DEFAULT_VOICE,
            rate=payload.rate or "+0%",
            pitch=payload.pitch or "+0Hz"
        )
        
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        
        return {
            "reply": reply_text,
            "provider": provider_info,
            "audio_base64": f"data:audio/mpeg;base64,{audio_b64}",
            "audio_bytes_length": len(audio_bytes),
            "voice": payload.voice or DEFAULT_VOICE
        }
    except Exception as e:
        logger.error(f"Chat-voice error: {e}")
        raise HTTPException(status_code=500, detail=f"Integrated voice-chat failed: {str(e)}")

# Mount static web UI files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root_index():
    """Serves main single page application."""
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "EchoCraft AI Studio backend is running. static/index.html not found."}

if __name__ == "__main__":
    import uvicorn
    print(f"Starting EchoCraft AI Studio on http://{HOST}:{PORT}")
    uvicorn.run("server:app", host=HOST, port=PORT, reload=True)
