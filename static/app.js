/**
 * EchoCraft AI Studio - Frontend Application Logic
 * Coordinates:
 * 1. Independent Voice Studio (Feature 1)
 * 2. Independent Chat Agent (Feature 2)
 * 3. Integrated Voice Chat Assistant (Combined Pipeline)
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Application State
    // -------------------------------------------------------------
    const state = {
        voices: [],
        defaultVoice: 'en-US-JennyNeural',
        systemStatus: null,
        chatHistory: [],
        integratedHistory: [],
        currentAudio: null,
        currentBlobUrl: null
    };

    // -------------------------------------------------------------
    // DOM Elements Cache
    // -------------------------------------------------------------
    // Status
    const systemStatusPill = document.getElementById('system-status');
    const statusText = document.getElementById('status-text');
    const activeProviderBadge = document.getElementById('active-provider-badge');

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Feature 1: Voice Studio
    const ttsTextInput = document.getElementById('tts-text-input');
    const ttsCharCount = document.getElementById('tts-char-count');
    const ttsVoiceSelect = document.getElementById('tts-voice-select');
    const ttsRateSlider = document.getElementById('tts-rate-slider');
    const ttsRateVal = document.getElementById('tts-rate-val');
    const ttsPitchSlider = document.getElementById('tts-pitch-slider');
    const ttsPitchVal = document.getElementById('tts-pitch-val');
    const ttsGenerateBtn = document.getElementById('tts-generate-btn');
    const ttsBtnLabel = document.getElementById('tts-btn-label');
    const ttsAudioElement = document.getElementById('tts-audio-element');
    const audioPlayerContainer = document.getElementById('audio-player-container');
    const audioMetaInfo = document.getElementById('audio-meta-info');
    const metaVoiceName = document.getElementById('meta-voice-name');
    const metaFileSize = document.getElementById('meta-file-size');
    const downloadActions = document.getElementById('download-actions');
    const ttsDownloadBtn = document.getElementById('tts-download-btn');

    // Feature 2: Chat Agent
    const chatProviderDisplay = document.getElementById('chat-provider-display');
    const chatClearBtn = document.getElementById('chat-clear-btn');
    const chatMessagesList = document.getElementById('chat-messages-list');
    const chatForm = document.getElementById('chat-form');
    const chatTextInput = document.getElementById('chat-text-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatPrompts = document.getElementById('chat-prompts');

    // Feature 3: Integrated Voice Chat
    const integratedVoiceSelect = document.getElementById('integrated-voice-select');
    const autoSpeakToggle = document.getElementById('auto-speak-toggle');
    const integratedClearBtn = document.getElementById('integrated-clear-btn');
    const integratedMessagesList = document.getElementById('integrated-messages-list');
    const integratedForm = document.getElementById('integrated-form');
    const integratedTextInput = document.getElementById('integrated-text-input');
    const integratedSendBtn = document.getElementById('integrated-send-btn');
    const speakingIndicator = document.getElementById('speaking-indicator');
    const stopSpeakingBtn = document.getElementById('stop-speaking-btn');
    const integratedPrompts = document.getElementById('integrated-prompts');

    // -------------------------------------------------------------
    // Initialization
    // -------------------------------------------------------------
    initApp();

    async function initApp() {
        setupTabs();
        setupVoiceStudioEvents();
        setupChatAgentEvents();
        setupIntegratedChatEvents();
        
        await checkBackendStatus();
        await loadVoices();
    }

    // -------------------------------------------------------------
    // Tab Navigation
    // -------------------------------------------------------------
    function setupTabs() {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTabId = btn.dataset.tab;

                tabButtons.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                tabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                const targetPane = document.getElementById(targetTabId);
                if (targetPane) targetPane.classList.add('active');
            });
        });
    }

    // -------------------------------------------------------------
    // Backend Status & Capabilities
    // -------------------------------------------------------------
    async function checkBackendStatus() {
        try {
            const res = await fetch('/api/status');
            if (!res.ok) throw new Error('Status endpoint error');
            const data = await res.json();
            state.systemStatus = data;

            systemStatusPill.classList.add('online');
            statusText.textContent = 'Backend Online (Ready)';

            const cap = data.capabilities;
            let badgeText = 'Engine: ';
            if (cap.gemini_configured) {
                badgeText += 'Gemini Flash';
            } else if (cap.openai_configured) {
                badgeText += 'OpenAI';
            } else {
                badgeText += 'Built-in Assistant (Zero Cost)';
            }
            activeProviderBadge.textContent = badgeText;
            chatProviderDisplay.textContent = badgeText;

            if (cap.default_voice) {
                state.defaultVoice = cap.default_voice;
            }
        } catch (err) {
            console.error('Failed to connect to backend:', err);
            statusText.textContent = 'Backend Offline';
            activeProviderBadge.textContent = 'Offline Mode';
        }
    }

    // -------------------------------------------------------------
    // Load Voice Catalog
    // -------------------------------------------------------------
    async function loadVoices() {
        try {
            const res = await fetch('/api/voices');
            const data = await res.json();
            state.voices = data.voices || [];

            populateVoiceSelects(state.voices);
        } catch (err) {
            console.error('Failed to load voices:', err);
        }
    }

    function populateVoiceSelects(voices) {
        const createOptions = () => {
            return voices.map(v => {
                const label = `${v.name} (${v.language} - ${v.gender}, ${v.accent})`;
                return `<option value="${v.shortName}">${label}</option>`;
            }).join('');
        };

        const optionsHtml = createOptions();
        ttsVoiceSelect.innerHTML = optionsHtml;
        integratedVoiceSelect.innerHTML = optionsHtml;

        // Select default
        if (state.defaultVoice) {
            ttsVoiceSelect.value = state.defaultVoice;
            integratedVoiceSelect.value = state.defaultVoice;
        }
    }

    // -------------------------------------------------------------
    // FEATURE 1: AI Voice Studio Logic
    // -------------------------------------------------------------
    function setupVoiceStudioEvents() {
        // Character counter
        const updateCharCount = () => {
            ttsCharCount.textContent = `${ttsTextInput.value.length} / 5,000`;
        };
        ttsTextInput.addEventListener('input', updateCharCount);
        updateCharCount();

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                ttsTextInput.value = btn.dataset.text;
                updateCharCount();
            });
        });

        // Sliders
        ttsRateSlider.addEventListener('input', () => {
            const val = parseInt(ttsRateSlider.value, 10);
            ttsRateVal.textContent = val === 0 ? 'Default (0%)' : `${val > 0 ? '+' : ''}${val}%`;
        });

        ttsPitchSlider.addEventListener('input', () => {
            const val = parseInt(ttsPitchSlider.value, 10);
            ttsPitchVal.textContent = val === 0 ? 'Default (0Hz)' : `${val > 0 ? '+' : ''}${val}Hz`;
        });

        // Audio element events for waveform animation
        ttsAudioElement.addEventListener('play', () => {
            audioPlayerContainer.classList.add('playing');
        });
        ttsAudioElement.addEventListener('pause', () => {
            audioPlayerContainer.classList.remove('playing');
        });
        ttsAudioElement.addEventListener('ended', () => {
            audioPlayerContainer.classList.remove('playing');
        });

        // Generate Speech Button
        ttsGenerateBtn.addEventListener('click', handleTTSGenerate);
    }

    async function handleTTSGenerate() {
        const text = ttsTextInput.value.trim();
        if (!text) {
            alert('Please enter text to synthesize into speech.');
            return;
        }

        const voice = ttsVoiceSelect.value;
        const rateVal = parseInt(ttsRateSlider.value, 10);
        const pitchVal = parseInt(ttsPitchSlider.value, 10);
        const rate = `${rateVal >= 0 ? '+' : ''}${rateVal}%`;
        const pitch = `${pitchVal >= 0 ? '+' : ''}${pitchVal}Hz`;

        ttsGenerateBtn.disabled = true;
        ttsBtnLabel.textContent = 'Synthesizing Neural Speech...';
        audioPlayerContainer.classList.add('loading');

        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice, rate, pitch })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'TTS synthesis failed');
            }

            const blob = await res.blob();
            if (state.currentBlobUrl) {
                URL.revokeObjectURL(state.currentBlobUrl);
            }
            state.currentBlobUrl = URL.createObjectURL(blob);

            // Update Audio Player
            ttsAudioElement.src = state.currentBlobUrl;
            audioPlayerContainer.classList.remove('empty');
            ttsAudioElement.play().catch(e => console.log('Autoplay deferred:', e));

            // Update Download Button
            ttsDownloadBtn.href = state.currentBlobUrl;
            const filename = `echocraft_${voice}_${Date.now()}.mp3`;
            ttsDownloadBtn.setAttribute('download', filename);

            // Update Metadata Info
            metaVoiceName.textContent = voice;
            metaFileSize.textContent = formatBytes(blob.size);
            audioMetaInfo.style.display = 'flex';
            downloadActions.style.display = 'block';

        } catch (err) {
            console.error('TTS Generation error:', err);
            alert(`Voice Generation Failed: ${err.message}`);
        } finally {
            ttsGenerateBtn.disabled = false;
            ttsBtnLabel.textContent = 'Generate Speech Audio';
            audioPlayerContainer.classList.remove('loading');
        }
    }

    // -------------------------------------------------------------
    // FEATURE 2: AI Chat Agent Logic
    // -------------------------------------------------------------
    function setupChatAgentEvents() {
        // Auto-expand textarea
        chatTextInput.addEventListener('input', () => {
            chatTextInput.style.height = 'auto';
            chatTextInput.style.height = Math.min(chatTextInput.scrollHeight, 120) + 'px';
        });

        // Submit form
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChatSubmit();
        });

        // Enter key to send (Shift+Enter for newline)
        chatTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });

        // Clear button
        chatClearBtn.addEventListener('click', () => {
            state.chatHistory = [];
            chatMessagesList.innerHTML = `
                <div class="message assistant">
                    <div class="avatar">AI</div>
                    <div class="msg-bubble">
                        <div class="msg-author">EchoCraft Assistant</div>
                        <div class="msg-content">Conversation cleared. What would you like to discuss next?</div>
                        <div class="msg-time">Just now</div>
                    </div>
                </div>
            `;
        });

        // Prompt chips
        chatPrompts.addEventListener('click', (e) => {
            const chip = e.target.closest('.prompt-chip');
            if (chip && chip.dataset.prompt) {
                chatTextInput.value = chip.dataset.prompt;
                handleChatSubmit();
            }
        });
    }

    async function handleChatSubmit() {
        const text = chatTextInput.value.trim();
        if (!text) return;

        // Append user message
        state.chatHistory.push({ role: 'user', content: text });
        appendChatMessage(chatMessagesList, 'user', text);
        chatTextInput.value = '';
        chatTextInput.style.height = 'auto';

        // Add loading placeholder
        const loadingId = 'loading-' + Date.now();
        appendLoadingBubble(chatMessagesList, loadingId);
        chatSendBtn.disabled = true;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: state.chatHistory, provider: 'auto' })
            });

            removeElement(loadingId);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Chat request failed');
            }

            const data = await res.json();
            const reply = data.reply;
            state.chatHistory.push({ role: 'assistant', content: reply });
            appendChatMessage(chatMessagesList, 'assistant', reply, data.provider);

        } catch (err) {
            removeElement(loadingId);
            appendChatMessage(chatMessagesList, 'assistant', `Error: ${err.message}. Please verify your connection or try again.`);
        } finally {
            chatSendBtn.disabled = false;
        }
    }

    // -------------------------------------------------------------
    // FEATURE 3: Integrated Voice Chat Logic
    // -------------------------------------------------------------
    function setupIntegratedChatEvents() {
        // Auto-expand textarea
        integratedTextInput.addEventListener('input', () => {
            integratedTextInput.style.height = 'auto';
            integratedTextInput.style.height = Math.min(integratedTextInput.scrollHeight, 120) + 'px';
        });

        // Submit form
        integratedForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleIntegratedChatSubmit();
        });

        // Enter key to send
        integratedTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleIntegratedChatSubmit();
            }
        });

        // Clear button
        integratedClearBtn.addEventListener('click', () => {
            state.integratedHistory = [];
            stopSpeaking();
            integratedMessagesList.innerHTML = `
                <div class="message assistant">
                    <div class="avatar">AI</div>
                    <div class="msg-bubble">
                        <div class="msg-author">Vocal AI Assistant</div>
                        <div class="msg-content">Conversation history cleared. Ask any question to hear the assistant respond aloud!</div>
                        <div class="msg-time">Ready</div>
                    </div>
                </div>
            `;
        });

        // Stop speaking button
        stopSpeakingBtn.addEventListener('click', stopSpeaking);

        // Prompt chips
        integratedPrompts.addEventListener('click', (e) => {
            const chip = e.target.closest('.prompt-chip');
            if (chip && chip.dataset.prompt) {
                integratedTextInput.value = chip.dataset.prompt;
                handleIntegratedChatSubmit();
            }
        });

        // Delegated click for audio buttons on message bubbles
        integratedMessagesList.addEventListener('click', async (e) => {
            const playBtn = e.target.closest('.msg-audio-play-btn');
            if (playBtn) {
                const textToSpeak = playBtn.dataset.text;
                const voice = integratedVoiceSelect.value;
                await playSpeechAudio(textToSpeak, voice);
            }
        });
    }

    async function handleIntegratedChatSubmit() {
        const text = integratedTextInput.value.trim();
        if (!text) return;

        state.integratedHistory.push({ role: 'user', content: text });
        appendChatMessage(integratedMessagesList, 'user', text);
        integratedTextInput.value = '';
        integratedTextInput.style.height = 'auto';

        const loadingId = 'int-loading-' + Date.now();
        appendLoadingBubble(integratedMessagesList, loadingId);
        integratedSendBtn.disabled = true;

        const voice = integratedVoiceSelect.value;
        const autoSpeak = autoSpeakToggle.checked;

        try {
            const res = await fetch('/api/chat-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: state.integratedHistory,
                    voice: voice,
                    provider: 'auto'
                })
            });

            removeElement(loadingId);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Integrated chat failed');
            }

            const data = await res.json();
            const reply = data.reply;
            state.integratedHistory.push({ role: 'assistant', content: reply });

            // Append assistant bubble with inline audio playback and download options
            appendIntegratedAssistantBubble(integratedMessagesList, reply, data.audio_base64, data.voice);

            // Auto-speak if enabled
            if (autoSpeak && data.audio_base64) {
                playAudioDataUrl(data.audio_base64);
            }

        } catch (err) {
            removeElement(loadingId);
            appendChatMessage(integratedMessagesList, 'assistant', `Error: ${err.message}.`);
        } finally {
            integratedSendBtn.disabled = false;
        }
    }

    function appendIntegratedAssistantBubble(container, text, audioDataUrl, voice) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message assistant';

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const formattedContent = escapeAndFormatMarkdown(text);

        let actionsHtml = '';
        if (audioDataUrl) {
            actionsHtml = `
                <div class="msg-actions">
                    <button class="msg-audio-play-btn" data-text="${escapeAttr(text)}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        <span>Replay Audio</span>
                    </button>
                    <a class="msg-audio-download-btn" href="${audioDataUrl}" download="ai_reply_${Date.now()}.mp3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Download MP3</span>
                    </a>
                </div>
            `;
        }

        msgDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="msg-bubble">
                <div class="msg-author">Vocal Assistant (${voice || 'Neural Voice'})</div>
                <div class="msg-content">${formattedContent}</div>
                ${actionsHtml}
                <div class="msg-time">${timeStr}</div>
            </div>
        `;

        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    // -------------------------------------------------------------
    // Audio Player Controllers
    // -------------------------------------------------------------
    async function playSpeechAudio(text, voice) {
        stopSpeaking();
        showSpeakingIndicator(true);

        try {
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice })
            });

            if (!res.ok) throw new Error('Speech synthesis failed');
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            playAudioDataUrl(blobUrl, true);
        } catch (err) {
            console.error('Audio playback error:', err);
            showSpeakingIndicator(false);
        }
    }

    function playAudioDataUrl(srcUrl, isBlob = false) {
        stopSpeaking();

        const audio = new Audio(srcUrl);
        state.currentAudio = audio;

        showSpeakingIndicator(true);

        audio.addEventListener('ended', () => {
            showSpeakingIndicator(false);
            if (isBlob) URL.revokeObjectURL(srcUrl);
            state.currentAudio = null;
        });

        audio.addEventListener('error', () => {
            showSpeakingIndicator(false);
            state.currentAudio = null;
        });

        audio.play().catch(e => {
            console.warn('Playback interrupted or blocked:', e);
            showSpeakingIndicator(false);
        });
    }

    function stopSpeaking() {
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio.currentTime = 0;
            state.currentAudio = null;
        }
        showSpeakingIndicator(false);
    }

    function showSpeakingIndicator(visible) {
        speakingIndicator.style.display = visible ? 'flex' : 'none';
    }

    // -------------------------------------------------------------
    // Chat Message Rendering Helpers
    // -------------------------------------------------------------
    function appendChatMessage(container, role, text, provider = '') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;

        const isUser = role === 'user';
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const authorName = isUser ? 'You' : `EchoCraft Assistant ${provider ? `(${provider})` : ''}`;
        const formattedContent = isUser ? escapeHtml(text) : escapeAndFormatMarkdown(text);

        msgDiv.innerHTML = `
            <div class="avatar">${isUser ? 'ME' : 'AI'}</div>
            <div class="msg-bubble">
                <div class="msg-author">${authorName}</div>
                <div class="msg-content">${formattedContent}</div>
                <div class="msg-time">${timeStr}</div>
            </div>
        `;

        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    function appendLoadingBubble(container, id) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.className = 'message assistant';
        loadingDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="msg-bubble">
                <div class="msg-author">EchoCraft Assistant</div>
                <div class="msg-content">
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                        Thinking...
                        <span class="mini-wave" style="height: 12px;">
                            <span></span><span></span><span></span>
                        </span>
                    </span>
                </div>
            </div>
        `;
        container.appendChild(loadingDiv);
        container.scrollTop = container.scrollHeight;
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/\n/g, ' ');
    }

    function escapeAndFormatMarkdown(text) {
        // Minimal safe Markdown formatter
        let out = escapeHtml(text);
        // Bold
        out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Inline code
        out = out.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>');
        // Bullet points
        out = out.replace(/^- (.*$)/gim, '<li>$1</li>');
        out = out.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        // Linebreaks
        out = out.replace(/\n\n/g, '<br><br>');
        return out;
    }

    function formatBytes(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
