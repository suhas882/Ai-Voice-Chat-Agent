# EchoCraft AI Studio 🎙️💬
> **A Beginner-Friendly, Low-Cost AI Voice Generation & Conversational Chat Agent Prototype**

EchoCraft AI Studio demonstrates how to build and integrate two fundamental AI capabilities:
1. **AI Voice Generation**: Text-to-speech synthesis with 300+ neural voices, customizable pitch/speed, waveform playback, and direct MP3 audio download.
2. **AI Chat Agent**: Conversational chatbot supporting multi-turn dialogue, prompt starters, and seamless provider switching (Google Gemini, OpenAI, or 100% Free Built-in Mode).
3. **Integrated Voice Chat**: A unified assistant where AI responses are automatically spoken aloud in real-time, complete with replay and individual audio downloads.

---

## 🌟 Key Features

| Modality | Features & Capabilities |
| :--- | :--- |
| **Feature 1: Voice Studio** *(Independent)* | • 300+ Microsoft Neural Voices across 70+ languages<br>• Speed (-50% to +50%) & Pitch (-20Hz to +20Hz) controls<br>• Waveform playback animation<br>• One-click MP3 download with zero API costs |
| **Feature 2: Chat Agent** *(Independent)* | • Multi-turn conversation history<br>• Markdown formatting with code styling<br>• Starter prompt chips for rapid interaction<br>• 100% Offline Educational Fallback Mode + Gemini/OpenAI hooks |
| **Integrated Voice Chat** *(Unified)* | • Simultaneous text response & neural speech generation<br>• Auto-Speak toggle switch<br>• Inline "Replay Audio" and "Download MP3" on every message<br>• Live "AI is speaking..." visualizer bar |

---

## 📐 Architecture & Technology Stack

```
   [ Browser Client (HTML5 / Modern CSS / Vanilla JS) ]
                          │
         REST API (HTTP / JSON / Audio Stream)
                          │
                          ▼
       [ FastAPI Python Backend (server.py) ]
          ├── GET  /api/status      (Health & Engine Capabilities)
          ├── GET  /api/voices      (Curated & Full Voice Catalogs)
          ├── POST /api/tts         (In-Memory MP3 Audio Stream)
          ├── POST /api/chat        (Multi-Provider Conversational AI)
          └── POST /api/chat-voice  (Synchronized Text + Base64 Audio)
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   [ Edge-TTS Engine ]      [ Conversational Engine ]
   • Microsoft Neural API   • Google Gemini 1.5 Flash (Free Tier)
   • 0 API Keys required    • OpenAI gpt-4o-mini (Low cost)
   • In-memory IO stream    • Built-in Assistant (Zero Cost / Offline)
```

---

## 🚀 Quickstart & Setup Commands

### Prerequisites
- Python 3.10+ (Verified on Python 3.11)
- Modern web browser (Chrome, Edge, Firefox, or Safari)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux / macOS:
cp .env.example .env
```

*(Optional)* If you have a Google Gemini API key or OpenAI key, open `.env` and add:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here
```
> **Note**: If no keys are provided, EchoCraft operates in **Built-in Assistant Mode** with zero costs and zero external setup!

### 3. Run Automated Tests
Verify all endpoints and voice generation pipelines:
```bash
python -m pytest test_app.py -v
```

### 4. Start the Application Server
```bash
python server.py
```
Or with Uvicorn directly:
```bash
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

### 5. Open the Web Application
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🧪 Testing & Verification Summary

The project includes automated integration tests in [`test_app.py`](file:///d:/SAMPLE_PROJECTS/test_app.py):
- `test_api_status`: Tests health check and capability detection.
- `test_get_voices_curated`: Tests voice listing and metadata.
- `test_tts_generation_independent`: Tests standalone MP3 synthesis and HTTP headers.
- `test_tts_empty_text_validation`: Tests boundary error handling on empty input.
- `test_chat_agent_independent`: Tests standalone chat reasoning and context.
- `test_integrated_chat_voice`: Tests combined conversational generation and audio encoding.

**Test Results**: `6 passed in 17.12s` (100% pass rate).

---

## 🌐 Cloud Deployment Guide (Render & Railway)

EchoCraft AI Studio comes pre-configured with [`render.yaml`](file:///d:/SAMPLE_PROJECTS/render.yaml), [`Procfile`](file:///d:/SAMPLE_PROJECTS/Procfile), [`railway.json`](file:///d:/SAMPLE_PROJECTS/railway.json), and [`Dockerfile`](file:///d:/SAMPLE_PROJECTS/Dockerfile) for seamless zero-friction cloud deployment.

### Option A: Deploy on Render (Recommended - Free Tier)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure cloud deployment for Render and Railway"
   git push origin main
   ```
2. **Log in to Render**: Navigate to [render.com](https://render.com) and log in with your GitHub account.
3. **Create New Web Service**:
   - Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repository: `suhas882/Ai-Voice-Chat-Agent`.
   - Render automatically recognizes Python:
     - **Runtime**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
     - **Instance Type**: `Free`
4. **Configure Environment Variables (Optional)**:
   - Under the **Environment Variables** section, add your preferred LLM provider keys if available:
     - `GEMINI_API_KEY`: *(optional, free tier from Google AI Studio)*
     - `GROQ_API_KEY`: *(optional, ultra-fast free tier from Groq)*
     - `OPENAI_API_KEY`: *(optional)*
   - *Note: If no API keys are provided, EchoCraft runs out-of-the-box in 100% Free Built-in Mode!*
5. Click **Create Web Service**. Your public live URL (e.g. `https://echocraft-ai-studio.onrender.com`) will be live within 2-3 minutes.

---

### Option B: Deploy on Railway

1. Navigate to [railway.com](https://railway.com) and log in.
2. Click **New Project** &rarr; **Deploy from GitHub repo**.
3. Select `suhas882/Ai-Voice-Chat-Agent`.
4. Railway will automatically detect [`railway.json`](file:///d:/SAMPLE_PROJECTS/railway.json) and build your service.
5. In **Settings** &rarr; **Networking**, click **Generate Domain** to receive your public `https://...up.railway.app` URL.

---

### Option C: Run with Docker

```bash
docker build -t echocraft-ai-studio .
docker run -p 8000:8000 echocraft-ai-studio
```
Open your browser at `http://localhost:8000`.

---

## 📁 Project Structure

```
d:\SAMPLE_PROJECTS\
├── Procfile                                   # Process declaration for Render & Railway
├── render.yaml                                # Render Blueprint specification
├── railway.json                               # Railway build & deploy specification
├── Dockerfile                                 # Multi-platform production container definition
├── .dockerignore                              # Docker build exclusion rules
├── runtime.txt                                # Python runtime specification (3.11.9)
├── .env.example                               # Sample environment settings
├── .env                                       # Active local environment settings
├── requirements.txt                           # Backend dependencies
├── server.py                                  # FastAPI application server
├── test_app.py                                # Automated pytest test suite
├── generate_docs.py                           # PDF and DOCX document compiler
├── static\
│   ├── index.html                             # Clean 3-tab responsive web interface
│   ├── style.css                              # Design system with dark theme & animations
│   └── app.js                                 # Client-side audio & chat orchestrator
├── docs\
│   ├── AI_Voice_Chat_Research_and_Design.md   # Full markdown research & design document
│   ├── AI_Voice_Chat_Research_and_Design.pdf  # Compiled research report in PDF
│   └── AI_Voice_Chat_Research_and_Design.docx # Compiled research report in Word DOCX
└── README.md                                  # Complete project documentation
```

---

## 💰 Cost & Free-Tier Blueprint

| Modality | Chosen Tool | Cost | Limits / Notes |
| :--- | :--- | :--- | :--- |
| **Voice Synthesis** | Microsoft Edge Neural TTS | **$0.00** | Zero API keys, studio neural fidelity |
| **Chat Intelligence** | Built-in Educational Assistant | **$0.00** | 100% offline, zero setup |
| **Chat Intelligence** | Google Gemini 1.5 Flash | **$0.00** | 15 RPM, 1,500 RPD free tier |
| **Audio Download** | In-Memory Streaming | **$0.00** | Direct client-side MP3 download |

---

## 📄 Research & Design Documentation

Comprehensive research and design specifications have been compiled and generated into:
- [Markdown Document](file:///d:/SAMPLE_PROJECTS/docs/AI_Voice_Chat_Research_and_Design.md)
- [PDF Document](file:///d:/SAMPLE_PROJECTS/docs/AI_Voice_Chat_Research_and_Design.pdf)
- [DOCX Document](file:///d:/SAMPLE_PROJECTS/docs/AI_Voice_Chat_Research_and_Design.docx)
