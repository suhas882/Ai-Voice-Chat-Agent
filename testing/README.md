# AI Voice Calling & IVR Platform with Voice Cloning

Project foundation for the assignment brief. It includes an API-backed dashboard, organization/agent/IVR workflows, a Twilio Programmable Voice adapter, and adapters for local Ollama, faster-whisper, Piper, and an optional Microsoft VibeVoice preview.

## Current scope

- Organization-scoped agent and IVR flow CRUD
- Owner/editor/viewer roles enforced by the API
- Versioned agent and IVR publishing
- IVR graph validation for reachability, dangling edges, and menu defaults
- Dashboard for agents, IVR flows, and call activity
- SQLite for local development; PostgreSQL is the deployment target
- Twilio signed webhook validation, bidirectional media-stream endpoint, call status callbacks, and outbound call gate
- Consent attestations, organization DNC list, organization-timezone calling window
- Local model health reporting, text turn endpoint, and uploaded-audio STT -> LLM -> TTS test endpoint
- Consent-recorded, offline Microsoft VibeVoice voice-cloning preview; not used for phone calls

This is a development foundation, not a production-ready calling service. Real calls require Twilio credentials, public HTTPS/WSS hosting, local model weights, tested hardware capacity, and compliance review. The dashboard does not place calls; the outbound API is disabled by default. Call recordings, campaigns, and full production compliance controls remain future work; see `docs/roadmap.md`.

## Run locally

Requirements: Python 3.11 or newer. Docker is optional. The local dashboard does not require Node.js.

```powershell
cd D:\SAMPLE_PROJECTS\testing
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn app.main:app --reload --app-dir backend
```

Open <http://127.0.0.1:8000>. API docs are at <http://127.0.0.1:8000/docs>.

The local starter creates a demo organization and user (`owner@voice.local` / `change-me-now`) on first run. Set `VAANI_BOOTSTRAP_PASSWORD` before the first launch to use a different password. New organizations can also be created through `POST /api/auth/signup`; email verification is a remaining requirement. Change the bootstrap password and set a strong `VAANI_SECRET_KEY` before exposing the app beyond localhost.

## Self-hosted voice models

Install the optional voice runtime dependencies in the active Python environment:

```powershell
pip install -r backend\requirements-ai.txt
```

Run Ollama locally, pull an open-weight model that fits your hardware, then set `OLLAMA_MODEL` to its local tag. Example: `ollama pull qwen3:4b`. Run Piper's local HTTP service with a voice model and set `PIPER_HTTP_URL` (default `http://127.0.0.1:5000`). Put a faster-whisper CTranslate2 model directory in `models/faster-whisper-small` and set `STT_MODEL_PATH` to that directory. Do not set the LLM URL to a hosted API; the platform calls the configured local Ollama `/api/chat` endpoint.

### Optional Microsoft VibeVoice offline preview

VibeVoice is available here only for offline, consent-gated voice previews. Microsoft marks its speech model as research-only, supports English and Chinese, and excludes real-time or low-latency telephony; therefore it is deliberately not selected by the live call pipeline. Its model card also requires explicit recorded consent for cloning and adds an audible AI disclaimer and provenance watermark.

On a machine with suitable PyTorch hardware and storage, install `backend/requirements-vibevoice.txt`, install the Hugging Face CLI if needed (`pip install --upgrade huggingface_hub`), and download `microsoft/VibeVoice-1.5B` with `hf download microsoft/VibeVoice-1.5B --local-dir models/vibevoice-1.5b`. Set `VIBEVOICE_MODEL_PATH` if you choose another local path. Model weights are large and are downloaded only by this manual command; the app uses local files only and will not fetch weights during startup or inference. The Integrations page exposes model readiness and the preview form. Register the speaker's recorded-consent reference there, then provide the speaker's WAV reference and preview text. Revoking that record blocks further previews. Keep Piper as the telephony TTS until a production-suitable model meeting the assignment's language and latency requirements is selected.

Use `GET /api/integrations` or the Integrations dashboard page to see which local services and weights are ready. `POST /api/voice/respond` checks text-to-LLM. `POST /api/voice/test` accepts `agent_id` and an audio file and runs the full local STT -> LLM -> TTS path. A successful model test requires the model weights and services to be installed first.

## Twilio setup

Configure Twilio credentials plus `VAANI_PUBLIC_BASE_URL` (public HTTPS), `VAANI_MEDIA_WS_URL` (public WSS ending in `/api/telephony/twilio/media`), and the organization/agent IDs for inbound routing. Point your Twilio number's incoming voice webhook to `/api/telephony/twilio/inbound` and use POST. Twilio signs these requests; the platform validates the signature with the official Twilio SDK. Media Streams use bidirectional `<Connect><Stream>` and signed WebSocket handshakes.

`VAANI_TWILIO_ENABLED` and `VAANI_ENABLE_OUTBOUND_CALLS` default to `false`. Before enabling outbound calls, configure the local STT/LLM/TTS services, submit a consent record through `POST /api/phone-consents`, and maintain the org DNC list through `POST /api/dnc`. The outbound route also checks the published agent and `VAANI_CALL_START_HOUR` / `VAANI_CALL_END_HOUR` in the organization's timezone. No real call was made while building this integration.

To run the containerized local stack, set a secret and then start Compose:

```powershell
$env:VAANI_SECRET_KEY = "use-a-long-random-value-here"
docker compose up --build
```

## Project structure

```text
backend/app/       FastAPI API, persistence, auth, and IVR validation
web/               Dashboard assets served by the API
docs/              Architecture, roadmap, and security notes
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `VAANI_DATABASE_URL` | `sqlite:///./vaani.db` | SQLAlchemy database URL |
| `VAANI_SECRET_KEY` | development-only value | Signs session tokens; set a secret in deployment |
| `VAANI_BOOTSTRAP_PASSWORD` | `change-me-now` | Password for the initial local owner account |
| `VAANI_PUBLIC_BASE_URL` | unset | Public HTTPS origin Twilio uses for callbacks |
| `VAANI_MEDIA_WS_URL` | unset | Public WSS endpoint for Twilio bidirectional media |
| `VAANI_TWILIO_ENABLED` | `false` | Master Twilio adapter gate |
| `VAANI_ENABLE_OUTBOUND_CALLS` | `false` | Additional outbound dialing gate |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | unset | Twilio API credentials and caller ID |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL` | local Ollama, unset model | Local LLM endpoint and model tag |
| `STT_MODEL_PATH` | `models/faster-whisper-small` | Local faster-whisper model directory |
| `PIPER_HTTP_URL` | `http://127.0.0.1:5000` | Local Piper HTTP service |
| `VIBEVOICE_MODEL_PATH` | `models/vibevoice-1.5b` | Local Microsoft VibeVoice weights for offline preview |
| `VIBEVOICE_DEVICE_MAP` | `auto` | Transformers device placement for the offline preview |

Never commit secrets or real call recordings. See `.env.example` and `.gitignore`.
