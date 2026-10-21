"""
Automated tests for EchoCraft AI Studio
Tests all core features independently and in integrated mode:
1. Status and capability reporting
2. Neural voices listing
3. AI Voice Generation (/api/tts)
4. AI Chat Agent (/api/chat)
5. Integrated Chat-Voice Pipeline (/api/chat-voice)
"""

import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

def test_api_status():
    """Verify health and capability detection endpoint."""
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "capabilities" in data
    assert data["capabilities"]["edge_tts"] is True

def test_get_voices_curated():
    """Verify curated voices catalog returns expected structure."""
    response = client.get("/api/voices")
    assert response.status_code == 200
    data = response.json()
    assert "voices" in data
    assert len(data["voices"]) > 0
    first_voice = data["voices"][0]
    assert "shortName" in first_voice
    assert "name" in first_voice
    assert "gender" in first_voice
    assert "locale" in first_voice

def test_tts_generation_independent():
    """Feature 1: Verify AI voice generation generates valid MP3 audio independently."""
    payload = {
        "text": "Hello world, this is a test of independent speech generation.",
        "voice": "en-US-JennyNeural",
        "rate": "+0%",
        "pitch": "+0Hz"
    }
    response = client.post("/api/tts", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert int(response.headers["content-length"]) > 1000
    assert len(response.content) > 1000

def test_tts_empty_text_validation():
    """Verify error handling on empty text input."""
    payload = {"text": "   ", "voice": "en-US-JennyNeural"}
    response = client.post("/api/tts", json=payload)
    assert response.status_code in [422, 500]

def test_chat_agent_independent():
    """Feature 2: Verify conversational agent generates response independently."""
    payload = {
        "messages": [
            {"role": "user", "content": "What is AI voice generation and how does it work?"}
        ],
        "provider": "builtin"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 10
    assert "provider" in data
    assert "builtin" in data["provider"]

def test_integrated_chat_voice():
    """Integrated Feature: Verify chat response generation combined with neural voice synthesis."""
    payload = {
        "messages": [
            {"role": "user", "content": "Give me a one sentence greeting."}
        ],
        "voice": "en-US-JennyNeural",
        "provider": "builtin"
    }
    response = client.post("/api/chat-voice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "audio_base64" in data
    assert data["audio_base64"].startswith("data:audio/mpeg;base64,")
    assert data["audio_bytes_length"] > 1000
