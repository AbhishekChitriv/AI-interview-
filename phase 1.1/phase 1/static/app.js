/* ==========================================================================
   Eliora AI HR - Interview Agent Platform Frontend Engine
   ========================================================================== */

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
const state = {
    currentTab: 'setup',
    candidateName: 'Alex Smith',
    jobTitle: 'Senior Software Engineer',
    numQuestions: 10,
    
    resumeText: '',
    jdText: '',
    candidateProfile: null,
    jdAnalysis: null,

    questions: [],
    currentQuestionIndex: 0,
    currentCandidateSpeech: '',
    evaluations: [],
    repeatCount: 0,

    avatarState: 'idle', // 'idle' | 'speaking' | 'listening' | 'thinking'
    isRecordingMic: false,
    autoVoiceMode: true,
    
    mediaRecorder: null,
    recordedChunks: [],
    currentSessionVideoBlob: null,
    currentSessionId: null,

    history: [],
    settings: {
        groqKey: '',
        geminiKey: '',
        voice: 'en-IN-NeerjaExpressiveNeural',  // Default: Indian Accent
        accent: 'indian'                         // 'indian' | 'foreign'
    }
};

// Audio & Animation References
let audioCtx = null;
let analyserNode = null;
let currentTTSAudio = null;
let speechRecognition = null;
let webcamStream = null;
let animationFrameId = null;

// Chart Instances
let radarChartInstance = null;

// ── INITIALIZATION ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initSpeechRecognition();
    initAvatarCanvas();
    initProctoring();
});

// ── NAVIGATION TABS ──────────────────────────────────────────────────────────
function switchNavTab(tabName) {
    state.currentTab = tabName;

    document.querySelectorAll('.view-tab').forEach(view => view.classList.remove('active'));

    const view = document.getElementById(`view-${tabName}`);

    if (view) view.classList.add('active');

    if (tabName === 'report') {
        renderReportView();
    }
}

// ── SETTINGS MANAGEMENT ──────────────────────────────────────────────────────
function toggleSettingsDrawer(open) {
    const drawer = document.getElementById('settings-drawer');
    const overlay = document.getElementById('settings-overlay');
    if (open) {
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.getElementById('groq-key-input').value = state.settings.groqKey || '';
        document.getElementById('gemini-key-input').value = state.settings.geminiKey || '';
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }
}

function saveSettings() {
    state.settings.groqKey = document.getElementById('groq-key-input').value.trim();
    state.settings.geminiKey = document.getElementById('gemini-key-input').value.trim();
    const voiceEl = document.getElementById('voice-speaker-select');
    if (voiceEl) state.settings.voice = voiceEl.value;

    localStorage.setItem('eliora_settings', JSON.stringify(state.settings));
    toggleSettingsDrawer(false);
    showToast('Settings saved successfully!');
}

function loadSettings() {
    const saved = localStorage.getItem('eliora_settings');
    if (saved) {
        try {
            state.settings = Object.assign(state.settings, JSON.parse(saved));
        } catch (e) {}
    }
    // Restore accent card UI to match saved accent
    if (state.settings.accent) {
        setTimeout(() => applyAccentUI(state.settings.accent), 100);
    }
}

// ── ACCENT SELECTION ─────────────────────────────────────────────────────────
const ACCENT_VOICES = {
    indian:  'en-IN-NeerjaExpressiveNeural',  // 🇮🇳 Indian English
    foreign: 'en-US-AriaNeural'               // 🌎 American English
};

function selectAccent(type) {
    if (!ACCENT_VOICES[type]) return;
    state.settings.accent = type;
    state.settings.voice  = ACCENT_VOICES[type];
    localStorage.setItem('eliora_settings', JSON.stringify(state.settings));
    applyAccentUI(type);
    showToast(type === 'indian' ? '🇮🇳 Indian Accent selected!' : '🌎 Foreign Accent selected!');
}

function applyAccentUI(type) {
    const pillIndian  = document.getElementById('accent-pill-indian');
    const pillForeign = document.getElementById('accent-pill-foreign');
    if (!pillIndian || !pillForeign) return;

    if (type === 'indian') {
        pillIndian.classList.add('active');
        pillForeign.classList.remove('active');
    } else {
        pillForeign.classList.add('active');
        pillIndian.classList.remove('active');
    }
}

// ── RESUME & JD PARSING API ──────────────────────────────────────────────────
function triggerFileInput(inputId) {
    document.getElementById(inputId).click();
}

async function handleResumeUpload(file) {
    if (!file) return;
    collapseUploadUI('resume-input-group', 'btn-change-resume');
    showToast(`Uploading resume ${file.name}...`);
    
    const formData = new FormData();
    formData.append('resume_file', file);
    if (state.settings.groqKey) formData.append('groq_api_key', state.settings.groqKey);

    try {
        const res = await fetch('/api/resume/parse', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            state.candidateProfile = data;
            state.resumeText = data.raw_text || '';
            renderParsedResume(data);
            showToast('Resume parsed successfully!');
        } else {
            expandUploadUI('resume-input-group', 'btn-change-resume');
            showToast(`Error: ${data.detail || 'Failed to parse resume'}`);
        }
    } catch (e) {
        console.error(e);
        expandUploadUI('resume-input-group', 'btn-change-resume');
        showToast('Failed to upload/parse resume.');
    }
}

async function parseResumeData() {
    const text = document.getElementById('resume-text-input').value.trim();
    if (!text) {
        showToast('Please upload a file or paste resume text.');
        return;
    }
    state.resumeText = text;
    collapseUploadUI('resume-input-group', 'btn-change-resume');
    showToast('Analyzing candidate resume...');

    const formData = new FormData();
    formData.append('resume_text', text);
    if (state.settings.groqKey) formData.append('groq_api_key', state.settings.groqKey);

    try {
        const res = await fetch('/api/resume/parse', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            state.candidateProfile = data;
            renderParsedResume(data);
            showToast('Resume profile extracted!');
        } else {
            expandUploadUI('resume-input-group', 'btn-change-resume');
        }
    } catch (e) {
        console.error(e);
        expandUploadUI('resume-input-group', 'btn-change-resume');
    }
}

function collapseUploadUI(groupId, reuploadBtnId) {
    const group = document.getElementById(groupId);
    const btn = document.getElementById(reuploadBtnId);
    if (group) group.style.display = 'none';
    if (btn) btn.style.display = 'inline-flex';
}

function expandUploadUI(groupId, reuploadBtnId) {
    const group = document.getElementById(groupId);
    const btn = document.getElementById(reuploadBtnId);
    if (group) group.style.display = '';
    if (btn) btn.style.display = 'none';
}

function renderParsedResume(data) {
    collapseUploadUI('resume-input-group', 'btn-change-resume');
    document.getElementById('parsed-resume-box').style.display = 'block';
    const jdCard = document.getElementById('card-jd-upload');
    if (jdCard) jdCard.style.display = 'none';
    const setupGrid = document.querySelector('#view-setup .setup-grid');
    if (setupGrid) setupGrid.style.gridTemplateColumns = '1fr';
    document.getElementById('res-profile-name').textContent = data.name || 'Candidate';
    document.getElementById('res-profile-title').textContent = data.title || 'Professional Candidate';
    document.getElementById('res-profile-summary').textContent = data.summary || '';
    
    document.getElementById('candidate-name-input').value = data.name !== 'Candidate' ? data.name : state.candidateName;

    const skillsContainer = document.getElementById('res-profile-skills');
    skillsContainer.innerHTML = '';
    (data.skills || []).forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip';
        chip.textContent = skill;
        skillsContainer.appendChild(chip);
    });

    // Populate AI Recommended Target Job Titles Dropdown
    const recommendedTitles = (data.recommended_job_titles && data.recommended_job_titles.length > 0) 
        ? data.recommended_job_titles 
        : ["Data Analyst", "Data Scientist", "Machine Learning Engineer", "AI Engineer", "Business Analyst"];

    const selectEl = document.getElementById('select-target-job-title');
    if (selectEl) {
        selectEl.innerHTML = '';
        recommendedTitles.forEach((t, idx) => {
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = idx === 0 ? `🎯 ${t} (Top AI Recommendation)` : t;
            selectEl.appendChild(opt);
        });

        // Set top recommended title as active selection
        const selectedTitle = recommendedTitles[0];
        selectEl.value = selectedTitle;
        onTargetJobTitleSelect(selectedTitle);
    }
}

function onTargetJobTitleSelect(selectedRole) {
    if (!selectedRole) return;
    state.jobTitle = selectedRole;
    
    // Pre-fill target job title inputs across setup page and dashboard
    const targetJobInput = document.getElementById('target-job-input');
    if (targetJobInput) targetJobInput.value = selectedRole;

    const jdRoleTitle = document.getElementById('jd-role-title');
    if (jdRoleTitle && (!state.jdAnalysis || !state.jdAnalysis.job_title)) {
        jdRoleTitle.textContent = selectedRole;
    }

    showToast(`Target Job Title set to: ${selectedRole}`);
}

async function handleJDUpload(file) {
    if (!file) return;
    collapseUploadUI('jd-input-group', 'btn-change-jd');
    showToast(`Uploading Job Description ${file.name}...`);
    
    const formData = new FormData();
    formData.append('jd_file', file);
    formData.append('resume_text', state.resumeText);
    if (state.settings.groqKey) formData.append('groq_api_key', state.settings.groqKey);

    try {
        const res = await fetch('/api/jd/parse', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            state.jdAnalysis = data;
            state.jdText = data.raw_jd_text || '';
            renderParsedJD(data);
            showToast('Job Description analyzed!');
        } else {
            expandUploadUI('jd-input-group', 'btn-change-jd');
        }
    } catch (e) {
        console.error(e);
        expandUploadUI('jd-input-group', 'btn-change-jd');
    }
}

async function parseJDData() {
    const text = document.getElementById('jd-text-input').value.trim();
    if (!text) {
        showToast('Please upload a file or paste Job Description text.');
        return;
    }
    state.jdText = text;
    collapseUploadUI('jd-input-group', 'btn-change-jd');
    showToast('Computing Resume-JD Match Score...');

    const formData = new FormData();
    formData.append('jd_text', text);
    formData.append('resume_text', state.resumeText);
    if (state.settings.groqKey) formData.append('groq_api_key', state.settings.groqKey);

    try {
        const res = await fetch('/api/jd/parse', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) {
            state.jdAnalysis = data;
            renderParsedJD(data);
            showToast('Resume vs JD match completed!');
        } else {
            expandUploadUI('jd-input-group', 'btn-change-jd');
        }
    } catch (e) {
        console.error(e);
        expandUploadUI('jd-input-group', 'btn-change-jd');
    }
}

function renderParsedJD(data) {
    collapseUploadUI('jd-input-group', 'btn-change-jd');
    document.getElementById('parsed-jd-box').style.display = 'block';
    const resumeCard = document.getElementById('card-resume-upload');
    if (resumeCard) resumeCard.style.display = 'none';
    const setupGrid = document.querySelector('#view-setup .setup-grid');
    if (setupGrid) setupGrid.style.gridTemplateColumns = '1fr';
    document.getElementById('jd-role-title').textContent = data.job_title || 'Target Role';
    document.getElementById('jd-seniority').textContent = data.seniority_level || 'Mid Level';
    document.getElementById('jd-match-percent').textContent = `${data.match_score || 80}%`;
    document.getElementById('jd-match-summary').textContent = data.analysis_summary || '';

    document.getElementById('target-job-input').value = data.job_title || state.jobTitle;

    const matchSkillsBox = document.getElementById('jd-matching-skills');
    matchSkillsBox.innerHTML = '';
    (data.matching_skills || []).forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip skill-chip-green';
        chip.textContent = `✓ ${skill}`;
        matchSkillsBox.appendChild(chip);
    });

    const missSkillsBox = document.getElementById('jd-missing-skills');
    missSkillsBox.innerHTML = '';
    (data.missing_skills || []).forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip skill-chip-amber';
        chip.textContent = `⚡ ${skill}`;
        missSkillsBox.appendChild(chip);
    });
}

// ── LAUNCH AI INTERVIEW SESSION ──────────────────────────────────────────────
async function generateAndStartInterview() {
    state.candidateName = document.getElementById('candidate-name-input').value.trim() || 'Alex Smith';
    state.jobTitle = document.getElementById('target-job-input').value.trim() || 'Senior Software Engineer';
    state.numQuestions = parseInt(document.getElementById('num-questions-select').value, 10);

    showToast('Generating personalized AI interview questions...');

    const formData = new FormData();
    formData.append('resume_text', state.resumeText || 'Software developer candidate.');
    formData.append('jd_text', state.jdText || '');
    formData.append('num_questions', state.numQuestions);
    if (state.settings.groqKey) formData.append('groq_api_key', state.settings.groqKey);

    try {
        const res = await fetch('/api/interview/start', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (res.ok && data.questions && data.questions.length > 0) {
            state.questions = data.questions;
            state.numQuestions = state.questions.length;
            state.currentQuestionIndex = 0;
            state.evaluations = [];
            state.currentSessionId = 'session_' + Date.now();
            
            switchNavTab('interview');
            await initWebcamStream();
            startSessionMediaRecording();
            startProctoringLoop();
            startQuestionFlow();
        } else {
            showToast('Failed to generate interview questions.');
        }
    } catch (e) {
        console.error(e);
        showToast('Error initializing interview session.');
    }
}

// ── SPEECH SYNTHESIS (TTS) & VIDEO AGENT SYNC ───────────────────────────────
let activeSpeechResolve = null;

function stopAgentSpeech() {
    if (activeSpeechResolve) {
        try { activeSpeechResolve(); } catch(e){}
        activeSpeechResolve = null;
    }
    if (currentTTSAudio) {
        try {
            currentTTSAudio.pause();
            currentTTSAudio.currentTime = 0;
        } catch(e){}
        currentTTSAudio = null;
    }
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch(e){}
    }
    const videoEl = document.getElementById('ai-agent-video');
    if (videoEl) {
        try {
            videoEl.pause();
            videoEl.currentTime = 0;
        } catch(e){}
    }
    const subtitleBox = document.getElementById('ai-subtitle-box');
    if (subtitleBox) {
        subtitleBox.style.display = 'none';
    }
    setAvatarState('listening');
}

function speakText(text) {
    return new Promise((resolve) => {
        if (!text) { resolve(); return; }

        // Stop any currently playing agent speech immediately
        stopAgentSpeech();
        activeSpeechResolve = resolve;

        const videoEl = document.getElementById('ai-agent-video');
        const subtitleBox = document.getElementById('ai-subtitle-box');
        const subtitleText = document.getElementById('ai-subtitle-text');

        const cleanedText = text.replace(/[*`#_\-\[\]]/g, '').trim();
        const humanText = cleanedText.replace(/,/g, ", ... ").replace(/\./g, ". ... ");

        // Show live AI subtitle with exact question text on screen
        if (subtitleBox && subtitleText) {
            subtitleText.textContent = cleanedText;
            subtitleBox.style.display = 'block';
        }

        const finishSpeech = () => {
            if (videoEl) {
                try {
                    videoEl.pause();
                    videoEl.currentTime = 0;
                } catch(e){}
            }
            setAvatarState('listening');
            if (subtitleBox) subtitleBox.style.display = 'none';

            if (state.isRecordingMic || state.autoVoiceMode) {
                startMicRecording();
            }

            if (activeSpeechResolve === resolve) {
                activeSpeechResolve = null;
                setTimeout(resolve, 100);
            }
        };

        const onSpeechStart = () => {
            setAvatarState('speaking');
            stopMicRecording();
            if (videoEl) {
                videoEl.currentTime = 0;
                videoEl.loop = true;
                videoEl.playbackRate = 1.0;
                videoEl.play().catch(e => console.warn('Video play error:', e));
            }
        };

        const onSpeechEnd = () => {
            finishSpeech();
        };

        // Try server-side Edge TTS first, fallback to browser SpeechSynthesis
        fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: humanText, voice: (state.settings && state.settings.voice) ? state.settings.voice : 'en-US-AriaNeural' })
        })
        .then(res => {
            if (res.ok) return res.blob();
            throw new Error('TTS server fallback');
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            if (currentTTSAudio) {
                try { currentTTSAudio.pause(); } catch(e){}
            }
            currentTTSAudio = new Audio(url);

            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') try { audioCtx.resume(); } catch(e){}
                if (!analyserNode) {
                    analyserNode = audioCtx.createAnalyser();
                    analyserNode.fftSize = 256;
                    analyserNode.connect(audioCtx.destination);
                }
                const source = audioCtx.createMediaElementSource(currentTTSAudio);
                source.connect(analyserNode);
            } catch (e) {
                console.warn('Web Audio API source binding bypassed:', e);
            }

            currentTTSAudio.onplay = onSpeechStart;
            currentTTSAudio.onended = onSpeechEnd;
            currentTTSAudio.onpause = () => {
                if (videoEl) videoEl.pause();
            };
            currentTTSAudio.onerror = () => fallbackBrowserTTS(humanText, onSpeechStart, onSpeechEnd);
            currentTTSAudio.play().catch(() => fallbackBrowserTTS(humanText, onSpeechStart, onSpeechEnd));
        })
        .catch(() => {
            fallbackBrowserTTS(humanText, onSpeechStart, onSpeechEnd);
        });
    });
}

function fallbackBrowserTTS(text, onStart, onEnd) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;

        // Select Female Voice exclusively for Eliora
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const preferred = voices.find(v => 
                v.name.toLowerCase().includes('zira') || 
                v.name.toLowerCase().includes('samantha') || 
                v.name.toLowerCase().includes('aria') || 
                v.name.toLowerCase().includes('female')
            );
            if (preferred) utterance.voice = preferred;
        }

        utterance.onstart = onStart;
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
        utterance.onpause = () => {
            const videoEl = document.getElementById('ai-agent-video');
            if (videoEl) videoEl.pause();
        };
        utterance.onresume = () => {
            const videoEl = document.getElementById('ai-agent-video');
            if (videoEl) videoEl.play().catch(e => console.warn(e));
        };

        window.speechSynthesis.speak(utterance);
    } else {
        setTimeout(onEnd, 2000);
    }
}


function renderQuestionStepDots() {
    const bar = document.getElementById('q-step-dots-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const total = state.questions.length || 10;
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'q-step-dot';
        if (i < state.currentQuestionIndex) {
            dot.classList.add('done');
            dot.textContent = '✓';
        } else if (i === state.currentQuestionIndex) {
            dot.classList.add('active');
            dot.textContent = i + 1;
        } else {
            dot.textContent = i + 1;
        }
        bar.appendChild(dot);
    }
}

function clearTranscriptScreen() {
    const feed = document.getElementById('transcript-feed');
    if (feed) feed.innerHTML = '';
}

async function startQuestionFlow() {
    if (state.currentQuestionIndex >= state.questions.length) {
        endInterviewSession();
        return;
    }

    // Stop any previous speech immediately
    stopAgentSpeech();

    // Open a fresh, clean screen for the new question section!
    clearTranscriptScreen();
    resetCandidateSpeech();
    renderQuestionStepDots();

    // Trigger fresh question screen animation
    const stageLayout = document.querySelector('.interview-stage-layout');
    if (stageLayout) {
        stageLayout.classList.remove('stage-fresh-anim');
        void stageLayout.offsetWidth;
        stageLayout.classList.add('stage-fresh-anim');
    }

    // Trigger dedicated question window pop animation
    const cardWin = document.getElementById('question-window-card');
    if (cardWin) {
        cardWin.classList.remove('question-active-anim');
        void cardWin.offsetWidth;
        cardWin.classList.add('question-active-anim');
    }

    const q = state.questions[state.currentQuestionIndex];
    
    document.getElementById('stage-job-title').textContent = state.jobTitle;
    document.getElementById('stage-question-counter').textContent = `Question ${state.currentQuestionIndex + 1} of ${state.questions.length}`;
    document.getElementById('question-category-tag').textContent = q.category || 'Technical';
    document.getElementById('question-intent-tag').textContent = q.intent || 'Assessing Competency';
    document.getElementById('current-question-text').textContent = q.question;

    // Show End Interview button ONLY on the last question!
    const isLastQ = state.currentQuestionIndex === state.questions.length - 1;
    const endBtn = document.getElementById('btn-end-interview');
    const submitBtn = document.getElementById('btn-submit-answer');
    if (endBtn) endBtn.style.display = isLastQ ? 'inline-flex' : 'none';
    if (submitBtn) submitBtn.textContent = isLastQ ? 'Finish & Submit Answer ✓' : 'Submit Answer & Next →';

    appendTranscriptMessage('ai', `AI Agent`, q.question);

    // Start 60s Question Timer
    startQuestionTimer(60);

    // Speak ONLY the question present on screen!
    await speakText(q.question);
}

let questionTimer = null;

function startQuestionTimer(seconds) {
    stopQuestionTimer();
    return;
}

function stopQuestionTimer() {
    if (typeof questionTimer !== 'undefined' && questionTimer) {
        try { clearInterval(questionTimer); } catch(e){}
        questionTimer = null;
    }
}

async function submitCurrentAnswer() {
    // Immediately stop any active speech when next question is clicked
    stopAgentSpeech();
    stopQuestionTimer();
    stopMicRecording();
    setAvatarState('thinking');

    const candidateAnswer = state.currentCandidateSpeech.trim() || '[No answer provided / Question skipped]';
    const currentQ = state.questions[state.currentQuestionIndex];

    appendTranscriptMessage('candidate', `${state.candidateName}`, candidateAnswer);

    // Launch AI evaluation silently in the background
    const evalPromise = fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question: currentQ.question,
            category: currentQ.category || 'Technical',
            candidate_answer: candidateAnswer,
            job_title: state.jobTitle,
            groq_api_key: state.settings.groqKey
        })
    })
    .then(res => res.json())
    .then(evalResult => {
        state.evaluations.push(evalResult);
        return evalResult;
    })
    .catch(err => {
        console.error('Background evaluation error:', err);
        const fallbackEval = {
            question: currentQ.question,
            category: currentQ.category || 'Technical',
            candidate_answer: candidateAnswer,
            scores: { technical_knowledge: 0, communication_clarity: 0, relevance_accuracy: 0, confidence_delivery: 0, overall_quality: 0 },
            overall_score: 0,
            feedback: "Question skipped or no response provided."
        };
        state.evaluations.push(fallbackEval);
        return fallbackEval;
    });

    if (!state.evaluationPromises) state.evaluationPromises = [];
    state.evaluationPromises.push(evalPromise);

    state.currentCandidateSpeech = '';
    resetCandidateSpeech();

    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < state.questions.length) {
        // Immediately open clean screen for the next question & start speaking it!
        startQuestionFlow();
    } else {
        // Automatic interview conclusion after final question!
        stopQuestionTimer();
        stopMicRecording();
        showToast('Interview complete! Automatically generating your performance report...');
        
        speakText("Thank you! You have completed all interview questions. Generating your final performance report.");
        
        // Auto-end interview and switch to Performance Report view automatically!
        setTimeout(() => {
            endInterviewSession();
        }, 1500);
    }
}

// ── END INTERVIEW SESSION FUNCTION ───────────────────────────────────────────
async function endInterviewSession() {
    stopQuestionTimer();
    stopMicRecording();

    // Cancel all speech and audio playback immediately
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (currentTTSAudio) {
        try { currentTTSAudio.pause(); } catch(e){}
        currentTTSAudio = null;
    }

    const videoEl = document.getElementById('ai-agent-video');
    if (videoEl) {
        try { videoEl.pause(); videoEl.currentTime = 0; } catch(e){}
    }

    const subtitleBox = document.getElementById('ai-subtitle-box');
    if (subtitleBox) subtitleBox.style.display = 'none';

    await stopSessionMediaRecording();
    stopProctoringLoop();
    stopWebcamStream();
    setAvatarState('idle');

    showToast('Finalizing candidate interview report...');

    let reportData = null;
    try {
        const res = await fetch('/api/interview/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                evaluations: state.evaluations.length > 0 ? state.evaluations : [
                    {
                        question: "General Competency",
                        category: "Behavioral",
                        candidate_answer: "Candidate concluded session.",
                        scores: { technical_knowledge: 80, communication_clarity: 80, relevance_accuracy: 80, confidence_delivery: 80, overall_quality: 80 },
                        overall_score: 80,
                        feedback: "Completed interview session."
                    }
                ],
                candidate_name: state.candidateName,
                job_title: state.jobTitle,
                groq_api_key: state.settings.groqKey
            })
        });

        if (res.ok) {
            reportData = await res.json();
        }
    } catch (e) {
        console.error('Report fetch error:', e);
    }

    if (!reportData) {
        reportData = {
            candidate_name: state.candidateName,
            job_title: state.jobTitle,
            overall_score: 80,
            recommendation: 'Hire',
            summary: `${state.candidateName} completed the AI interview session for ${state.jobTitle}.`,
            top_strengths: ['Communication', 'Domain Knowledge', 'Problem Solving'],
            top_weaknesses: ['Can expand on system metrics'],
            hiring_note: 'Candidate completed interview session cleanly.',
            individual_evaluations: state.evaluations
        };
    }

    state.currentReport = reportData;

    // Save session record to history
    const sessionRecord = {
        id: state.currentSessionId || ('session_' + Date.now()),
        date: new Date().toLocaleDateString(),
        candidateName: state.candidateName,
        jobTitle: state.jobTitle,
        score: reportData.overall_score || 80,
        recommendation: reportData.recommendation || 'Hire',
        report: reportData,
        videoBlob: state.currentSessionVideoBlob
    };

    state.history.unshift(sessionRecord);
    saveHistory(sessionRecord);

    switchNavTab('report');
}

// ── TRANSCRIPT FEED RENDER ───────────────────────────────────────────────────
function appendTranscriptMessage(role, author, text) {
    const feed = document.getElementById('transcript-feed');
    if (!feed) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `transcript-msg msg-${role}`;
    
    const authorSpan = document.createElement('span');
    authorSpan.className = 'msg-author';
    authorSpan.textContent = author;

    const bodyP = document.createElement('p');
    bodyP.className = 'msg-body';
    bodyP.textContent = text;

    msgDiv.appendChild(authorSpan);
    msgDiv.appendChild(bodyP);
    feed.appendChild(msgDiv);

    feed.scrollTop = feed.scrollHeight;
}

// ── SPEECH RECOGNITION (STT) CONTINUOUS ACCUMULATOR ────────────────────────
let accumulatedTranscript = '';

function resetCandidateSpeech() {
    accumulatedTranscript = '';
    state.currentCandidateSpeech = '';
    const dictationEl = document.getElementById('dictation-text');
    if (dictationEl) dictationEl.textContent = 'Listening... (Speak your answer aloud)';
}

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
        let currentSessionFinal = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; i++) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                currentSessionFinal += transcriptChunk + ' ';
            } else {
                currentInterim += transcriptChunk;
            }
        }

        const combinedText = (accumulatedTranscript + ' ' + currentSessionFinal + ' ' + currentInterim).trim().replace(/\s+/g, ' ');
        state.currentCandidateSpeech = combinedText;
        
        const previewEl = document.getElementById('dictation-text');
        if (previewEl) previewEl.textContent = combinedText || 'Listening... (Speak naturally)';
    };

    speechRecognition.onerror = (err) => {
        console.warn('Speech recognition error:', err);
    };

    speechRecognition.onend = () => {
        if (state.currentCandidateSpeech) {
            accumulatedTranscript = state.currentCandidateSpeech;
        }
        if (state.isRecordingMic) {
            try { speechRecognition.start(); } catch (e) {}
        }
    };
}

function toggleMicRecording() {
    if (state.isRecordingMic) {
        stopMicRecording();
    } else {
        startMicRecording();
    }
}

function startMicRecording() {
    state.isRecordingMic = true;
    const btn = document.getElementById('btn-toggle-mic');
    btn.classList.add('active');
    document.getElementById('btn-mic-text').textContent = 'Listening (Click to Stop)';
    document.getElementById('mic-status-badge').textContent = 'Mic Active';

    if (speechRecognition) {
        try { speechRecognition.start(); } catch (e) {}
    }
}

function stopMicRecording() {
    state.isRecordingMic = false;
    const btn = document.getElementById('btn-toggle-mic');
    btn.classList.remove('active');
    document.getElementById('btn-mic-text').textContent = 'Hold or Click to Speak';
    document.getElementById('mic-status-badge').textContent = 'Mic Paused';

    if (speechRecognition) {
        try { speechRecognition.stop(); } catch (e) {}
    }
}

function onAutoVoiceToggle() {
    state.autoVoiceMode = document.getElementById('chk-auto-voice').checked;
}

// ── TALKING AVATAR VIDEO STREAM & ANIMATION ENGINE ─────────────────────────
const avatarImages = {
    idle: new Image(),
    speaking: new Image(),
    listening: new Image()
};

avatarImages.idle.src = '/static/avatar/eliora_idle.png';
avatarImages.speaking.src = '/static/avatar/eliora_speaking.png';
avatarImages.listening.src = '/static/avatar/eliora_listening.png';

let blinkTimer = 0;
let isBlinking = false;
let avatarVideoStreamBound = false;

function setAvatarState(newState) {
    state.avatarState = newState;
    const dotEl = document.getElementById('avatar-status-dot');
    const textEl = document.getElementById('avatar-status-text');

    if (dotEl) dotEl.className = `status-dot status-${newState}`;

    if (textEl) {
        if (newState === 'speaking') textEl.textContent = 'Eliora - Speaking (Talking Agent Active)';
        else if (newState === 'listening') textEl.textContent = 'Eliora - Listening Attentively';
        else if (newState === 'thinking') textEl.textContent = 'Eliora - Evaluating Response...';
        else textEl.textContent = 'Eliora - Ready';
    }
}

function initAvatarCanvas() {
    const canvas = document.getElementById('avatar-render-canvas');
    const videoStreamEl = document.getElementById('eliora-talking-video-stream');
    const liveWaveform = document.getElementById('live-waveform-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const waveCtx = liveWaveform ? liveWaveform.getContext('2d') : null;

    // Stream canvas content to HTML5 video element for authentic live talking video feed
    if (videoStreamEl && canvas.captureStream && !avatarVideoStreamBound) {
        try {
            const stream = canvas.captureStream(30);
            videoStreamEl.srcObject = stream;
            avatarVideoStreamBound = true;
        } catch (e) {
            console.warn('Canvas stream capture error:', e);
        }
    }

    function renderLoop() {
        const parent = canvas.parentElement;
        if (parent && (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight)) {
            canvas.width = parent.clientWidth || 640;
            canvas.height = parent.clientHeight || 480;
        }

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Determine base image layer
        let currentImg = avatarImages.idle;
        if (state.avatarState === 'speaking') currentImg = avatarImages.speaking;
        else if (state.avatarState === 'listening') currentImg = avatarImages.listening;

        // Subtle posture sway float (breathing / living motion)
        const time = Date.now() * 0.002;
        const swayX = Math.sin(time) * 3;
        const swayY = Math.cos(time * 1.5) * 2;

        // Draw Base Avatar Image Layer
        if (currentImg.complete && currentImg.naturalWidth > 0) {
            ctx.drawImage(currentImg, swayX - 5, swayY - 5, w + 10, h + 10);
        }

        // Calculate real-time audio energy for lip sync
        let audioFreq = 0;
        if (analyserNode && state.avatarState === 'speaking') {
            const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
            analyserNode.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            audioFreq = sum / dataArray.length;
        }

        // Eye Blinking Animation Logic
        blinkTimer++;
        if (blinkTimer > 180 + Math.random() * 120) {
            isBlinking = true;
            if (blinkTimer > 192 + Math.random() * 120) {
                isBlinking = false;
                blinkTimer = 0;
            }
        }

        if (isBlinking) {
            ctx.fillStyle = '#64748b';
            const eyeY = h * 0.32 + swayY;
            ctx.fillRect(w * 0.42 + swayX, eyeY, 24, 4);
            ctx.fillRect(w * 0.54 + swayX, eyeY, 24, 4);
        }

        // DYNAMIC TALKING AGENT MOUTH & LIP-SYNC MORPHING
        if (state.avatarState === 'speaking') {
            const cx = w * 0.49 + swayX;
            const cy = h * 0.46 + swayY;
            const mouthWidth = 28 + Math.min(22, audioFreq * 0.45);
            const mouthHeight = 8 + Math.min(20, audioFreq * 0.65);

            // Inner Mouth cavity
            ctx.beginPath();
            ctx.fillStyle = '#3a0c10';
            ctx.ellipse(cx, cy, mouthWidth / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Upper teeth line
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - mouthWidth / 3, cy - mouthHeight / 2 + 1, mouthWidth * 0.66, 3);

            // Tongue highlight
            if (mouthHeight > 10) {
                ctx.beginPath();
                ctx.fillStyle = '#e11d48';
                ctx.ellipse(cx, cy + mouthHeight / 3, mouthWidth / 3, mouthHeight / 4, 0, 0, Math.PI);
                ctx.fill();
            }

            // Outer Lip Contour
            ctx.beginPath();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3;
            ctx.ellipse(cx, cy, mouthWidth / 2 + 2, mouthHeight / 2 + 2, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Glowing speech energy aura ring
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245, 158, 11, ${Math.min(0.8, audioFreq / 40)})`;
            ctx.lineWidth = 4;
            ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.42, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Render audio visualizer bar under video screen
        if (waveCtx && liveWaveform) {
            liveWaveform.width = liveWaveform.parentElement.clientWidth;
            liveWaveform.height = liveWaveform.parentElement.clientHeight;
            waveCtx.clearRect(0, 0, liveWaveform.width, liveWaveform.height);

            waveCtx.beginPath();
            waveCtx.strokeStyle = state.avatarState === 'speaking' ? '#f59e0b' : '#3b82f6';
            waveCtx.lineWidth = 2.5;

            const sliceWidth = liveWaveform.width / 50;
            let x = 0;
            for (let i = 0; i < 50; i++) {
                const amp = (state.avatarState === 'speaking' || state.isRecordingMic) 
                    ? Math.sin(i * 0.3 + Date.now() * 0.012) * (10 + audioFreq * 0.3) 
                    : 2;
                const y = liveWaveform.height / 2 + amp;
                if (i === 0) waveCtx.moveTo(x, y);
                else waveCtx.lineTo(x, y);
                x += sliceWidth;
            }
            waveCtx.stroke();
        }

        animationFrameId = requestAnimationFrame(renderLoop);
    }

    renderLoop();
}

// ── WEBCAM & MEDIA RECORDER ──────────────────────────────────────────────────
async function initWebcamStream() {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoEl = document.getElementById('candidate-webcam-video');
        if (videoEl) videoEl.srcObject = webcamStream;
    } catch (e) {
        console.warn('Webcam stream unavailable:', e);
    }
}

function stopWebcamStream() {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
}

function startSessionMediaRecording() {
    state.recordedChunks = [];
    if (!webcamStream) return;

    try {
        state.mediaRecorder = new MediaRecorder(webcamStream);
        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) state.recordedChunks.push(e.data);
        };
        state.mediaRecorder.onstop = () => {
            state.currentSessionVideoBlob = new Blob(state.recordedChunks, { type: 'video/webm' });
        };
        state.mediaRecorder.start();
    } catch (e) {
        console.warn('MediaRecorder error:', e);
    }
}

function stopSessionMediaRecording() {
    return new Promise(resolve => {
        if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
            state.mediaRecorder.onstop = () => {
                state.currentSessionVideoBlob = new Blob(state.recordedChunks, { type: 'video/webm' });
                resolve();
            };
            state.mediaRecorder.stop();
        } else {
            resolve();
        }
    });
}

// ── REPORT VIEW RENDER ───────────────────────────────────────────────────────
// ── REPORT VIEW RENDER & CLEAN PDF EXPORT ───────────────────────────────────
function renderReportView() {
    const report = state.currentReport || (state.history.length > 0 ? state.history[0].report : null);
    if (!report) return;

    const candName = report.candidate_name || state.candidateName || "Candidate";
    const jobTitle = report.job_title || state.jobTitle || "Target Role";
    const overallScore = report.overall_score || 80;
    const recText = report.recommendation || "Hire";

    document.getElementById('report-candidate-name').textContent = candName;
    document.getElementById('report-job-title').textContent = `${jobTitle} • Interview Assessment`;
    document.getElementById('report-timestamp').textContent = `Date: ${new Date().toLocaleDateString()}`;
    
    // Overall Score & Badge
    const scoreNum = document.getElementById('report-overall-score-num');
    if (scoreNum) scoreNum.textContent = overallScore;

    const badge = document.getElementById('report-recommendation-badge');
    if (badge) {
        badge.textContent = recText;
        if (overallScore >= 80) {
            badge.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (overallScore >= 65) {
            badge.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else {
            badge.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }
    }

    // Render Competencies Progress Bars
    const compGrid = document.getElementById('report-competency-grid');
    if (compGrid) {
        compGrid.innerHTML = '';
        const metrics = report.radar_metrics || {
            "Technical Knowledge": 80,
            "Communication Clarity": 85,
            "Relevance & Accuracy": 80,
            "Confidence & Delivery": 75,
            "Answer Quality": 80
        };

        for (const [dimName, val] of Object.entries(metrics)) {
            const barColor = val >= 80 ? 'var(--accent-green)' : (val >= 65 ? 'var(--primary-yellow)' : 'var(--accent-red)');
            const card = document.createElement('div');
            card.className = 'glass';
            card.style.padding = '12px 16px';
            card.style.borderRadius = '10px';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 600; font-size: 0.9rem;">${dimName}</span>
                    <span style="font-weight: 700; font-size: 0.9rem; color: ${barColor};">${val}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${val}%; height: 100%; background: ${barColor}; border-radius: 4px; transition: width 0.6s ease;"></div>
                </div>
            `;
            compGrid.appendChild(card);
        }
    }

    document.getElementById('report-exec-summary').textContent = report.summary || '';
    document.getElementById('report-hiring-note').textContent = report.hiring_note || '';

    // Render Strengths
    const strengthsList = document.getElementById('report-strengths-list');
    if (strengthsList) {
        strengthsList.innerHTML = '';
        (report.top_strengths || []).forEach(s => {
            const li = document.createElement('li');
            li.textContent = `✓ ${s}`;
            strengthsList.appendChild(li);
        });
    }

    // Render Weaknesses
    const weaknessList = document.getElementById('report-weakness-list');
    if (weaknessList) {
        weaknessList.innerHTML = '';
        (report.top_weaknesses || []).forEach(w => {
            const li = document.createElement('li');
            li.textContent = `⚡ ${w}`;
            weaknessList.appendChild(li);
        });
    }

    // Render Actionable Improvement Roadmap
    const roadmapContainer = document.getElementById('report-improvement-roadmap');
    if (roadmapContainer) {
        roadmapContainer.innerHTML = '';
        const steps = report.improvement_roadmap || [
            "1. Adopt the STAR Method (Situation, Task, Action, Result) to structure behavioral scenarios.",
            "2. Deepen Technical Trade-offs: Discuss time vs space complexity, architectural patterns, and scalability choices.",
            "3. Quantify Past Achievements: Include concrete metrics (% latency reduction, revenue increase) in answers.",
            "4. Refine Answer Conciseness & Pace: Keep responses structured and deliver key points within 90-120 seconds."
        ];

        steps.forEach((stepText) => {
            const stepDiv = document.createElement('div');
            stepDiv.style.background = 'rgba(255, 255, 255, 0.04)';
            stepDiv.style.borderLeft = '4px solid var(--primary-yellow)';
            stepDiv.style.borderRadius = '0 8px 8px 0';
            stepDiv.style.padding = '12px 16px';
            stepDiv.style.fontSize = '0.9rem';
            stepDiv.style.lineHeight = '1.5';
            stepDiv.textContent = stepText;
            roadmapContainer.appendChild(stepDiv);
        });
    }

    // Render Question-by-Question Breakdown
    const questionsBreakdown = document.getElementById('report-questions-breakdown');
    if (questionsBreakdown) {
        questionsBreakdown.innerHTML = '';
        const evals = report.individual_evaluations || state.evaluations || [];

        if (evals.length === 0) {
            questionsBreakdown.innerHTML = '<p class="text-muted">No individual question evaluations recorded for this session.</p>';
        } else {
            evals.forEach((ev, idx) => {
                const qScore = ev.overall_score || 80;
                const qCategory = ev.category || 'Technical';
                const qText = ev.question || `Question ${idx + 1}`;
                const ansText = ev.candidate_answer || 'No answer recorded.';
                const qFeedback = ev.feedback || '';
                const strengths = ev.strengths || [];
                const weaknesses = ev.weaknesses || [];
                const idealPoints = ev.ideal_answer_points || [];

                const card = document.createElement('div');
                card.className = 'eval-item';
                card.style.background = 'rgba(255, 255, 255, 0.03)';
                card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                card.style.borderRadius = '12px';
                card.style.padding = '20px';
                card.style.marginBottom = '16px';

                let cardHtml = `
                    <div class="eval-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                        <div>
                            <span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; margin-right: 8px;">
                                Question ${idx + 1} • ${qCategory}
                            </span>
                            <strong style="font-size: 1rem; color: #fff;">${qText}</strong>
                        </div>
                        <span class="eval-score-badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; padding: 4px 12px; border-radius: 12px; font-weight: 700;">
                            ${qScore} / 100
                        </span>
                    </div>

                    <div class="eval-answer-block" style="background: rgba(0, 0, 0, 0.2); border-left: 3px solid var(--primary-yellow); padding: 12px 16px; margin: 12px 0; border-radius: 4px; font-size: 0.88rem; color: #cbd5e1;">
                        <strong>Candidate Response:</strong> "${ansText}"
                    </div>
                `;

                if (qFeedback) {
                    cardHtml += `<p style="font-size: 0.88rem; color: #94a3b8; margin-bottom: 12px;"><strong>Evaluator Feedback:</strong> ${qFeedback}</p>`;
                }

                if (strengths.length > 0 || weaknesses.length > 0) {
                    cardHtml += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 12px; font-size: 0.85rem;">`;
                    if (strengths.length > 0) {
                        cardHtml += `
                            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px 14px;">
                                <strong class="text-green">✓ Strengths:</strong>
                                <ul style="margin-top: 4px; padding-left: 16px; color: #a7f3d0;">
                                    ${strengths.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    if (weaknesses.length > 0) {
                        cardHtml += `
                            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 10px 14px;">
                                <strong class="text-amber">⚡ Areas to Improve:</strong>
                                <ul style="margin-top: 4px; padding-left: 16px; color: #fde68a;">
                                    ${weaknesses.map(w => `<li>${w}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    cardHtml += `</div>`;
                }

                if (idealPoints.length > 0) {
                    cardHtml += `
                        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 10px 14px; font-size: 0.85rem;">
                            <strong style="color: #60a5fa;">💡 Model Answer Key Points (How to Get 100%):</strong>
                            <ul style="margin-top: 4px; padding-left: 16px; color: #bfdbfe;">
                                ${idealPoints.map(p => `<li>${p}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                card.innerHTML = cardHtml;
                questionsBreakdown.appendChild(card);
            });
        }
    }
}

// ── GENERATE STANDALONE CLEAN PDF HTML REPORT ──────────────────────────────
function generateCleanReportHTML(report) {
    const candidateName = report.candidate_name || state.candidateName || "Candidate";
    const jobTitle = report.job_title || state.jobTitle || "Target Role";
    const overallScore = report.overall_score || 80;
    const recommendation = report.recommendation || "Recommended";
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Core metrics
    const metrics = report.radar_metrics || {
        "Technical Knowledge": 80,
        "Communication Clarity": 85,
        "Relevance & Accuracy": 80,
        "Confidence & Delivery": 75,
        "Answer Quality": 80
    };

    // Build competencies HTML
    let compHtml = '';
    for (const [key, val] of Object.entries(metrics)) {
        const barColor = val >= 80 ? '#059669' : (val >= 65 ? '#d97706' : '#dc2626');
        compHtml += `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #1e293b;">
                    <span>${key}</span>
                    <span>${val}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${val}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>
                </div>
            </div>
        `;
    }

    // Build Strengths HTML
    const strengths = report.top_strengths || ["Demonstrated core domain familiarity", "Structured responses"];
    let strengthsHtml = strengths.map(s => `<li style="margin-bottom: 6px; color: #15803d;"><strong>✓</strong> ${s}</li>`).join('');

    // Build Weaknesses HTML
    const weaknesses = report.top_weaknesses || ["Could provide deeper architectural trade-offs", "Incorporate quantitative metrics"];
    let weaknessesHtml = weaknesses.map(w => `<li style="margin-bottom: 6px; color: #b45309;"><strong>⚡</strong> ${w}</li>`).join('');

    // Build Roadmap HTML
    const roadmap = report.improvement_roadmap || [
        "1. Adopt the STAR Method (Situation, Task, Action, Result) for behavioral scenarios.",
        "2. Deepen Technical Trade-offs: Always discuss complexity, edge cases, and architectural alternatives.",
        "3. Quantify Achievements: Include concrete metrics and business outcomes in answers.",
        "4. Refine Delivery & Pace: Deliver clear, concise answers within 90-120 seconds."
    ];
    let roadmapHtml = roadmap.map(step => `
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 10px 14px; margin-bottom: 8px; border-radius: 0 6px 6px 0; font-size: 13px; color: #334155;">
            ${step}
        </div>
    `).join('');

    // Build Individual Evaluations HTML
    const evals = report.individual_evaluations || state.evaluations || [];
    let evalsHtml = '';
    evals.forEach((ev, idx) => {
        const qScore = ev.overall_score || 80;
        const qScoreColor = qScore >= 80 ? '#059669' : (qScore >= 65 ? '#d97706' : '#dc2626');
        const qCategory = ev.category || 'Technical';
        const qText = ev.question || `Question ${idx + 1}`;
        const ansText = ev.candidate_answer || 'No response recorded.';
        const qStrengths = ev.strengths || [];
        const qWeaknesses = ev.weaknesses || [];
        const qFeedback = ev.feedback || '';
        const idealPoints = ev.ideal_answer_points || [];

        evalsHtml += `
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                    <div>
                        <span style="background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-right: 8px; text-transform: uppercase;">
                            Question ${idx + 1} • ${qCategory}
                        </span>
                        <h4 style="display: inline; font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">${qText}</h4>
                    </div>
                    <span style="background: ${qScoreColor}15; color: ${qScoreColor}; font-weight: 800; font-size: 13px; padding: 4px 10px; border-radius: 16px; border: 1px solid ${qScoreColor};">
                        Score: ${qScore}/100
                    </span>
                </div>
                
                <div style="background: #f8fafc; border-left: 3px solid #64748b; padding: 8px 12px; font-size: 12.5px; color: #475569; margin-bottom: 10px; font-style: italic;">
                    <strong>Candidate Answer:</strong> "${ansText}"
                </div>

                ${qFeedback ? `<p style="font-size: 12.5px; color: #334155; margin-bottom: 8px;"><strong>Evaluator Feedback:</strong> ${qFeedback}</p>` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; font-size: 12px;">
                    ${qStrengths.length > 0 ? `
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px;">
                            <strong style="color: #166534;">✓ Answer Strengths:</strong>
                            <ul style="margin: 4px 0 0 16px; padding: 0; color: #15803d;">
                                ${qStrengths.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${qWeaknesses.length > 0 ? `
                        <div style="background: #fffbeb; border: 1px solid #fef08a; border-radius: 6px; padding: 8px 12px;">
                            <strong style="color: #92400e;">⚡ Gaps / Areas to Improve:</strong>
                            <ul style="margin: 4px 0 0 16px; padding: 0; color: #b45309;">
                                ${qWeaknesses.map(w => `<li>${w}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                ${idealPoints.length > 0 ? `
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; font-size: 12px;">
                        <strong style="color: #1e40af;">💡 How to Achieve a 100% Score (Key Model Answer Points):</strong>
                        <ul style="margin: 4px 0 0 16px; padding: 0; color: #1d4ed8;">
                            ${idealPoints.map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    });

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Assessment Report - ${candidateName}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .header-title h1 {
            font-size: 22px;
            margin: 0 0 4px 0;
            color: #0f172a;
        }
        .header-title p {
            margin: 0;
            font-size: 13px;
            color: #64748b;
        }
        .score-badge-box {
            text-align: center;
            background: #f8fafc;
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 8px 16px;
        }
        .score-num-big {
            font-size: 28px;
            font-weight: 800;
            color: #2563eb;
            line-height: 1;
        }
        .rec-pill {
            display: inline-block;
            margin-top: 4px;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 10px;
            border-radius: 10px;
            background: #2563eb;
            color: #ffffff;
            text-transform: uppercase;
        }
        .section-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 18px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #1e293b;
            margin: 0 0 12px 0;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 6px;
        }
        .grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        ul { margin: 0; padding-left: 18px; }
        li { margin-bottom: 4px; font-size: 12.5px; }
    </style>
</head>
<body>
    <div class="report-header">
        <div class="header-title">
            <h1>${candidateName}</h1>
            <p><strong>Target Role:</strong> ${jobTitle} | <strong>Assessment Date:</strong> ${dateStr}</p>
            <p style="margin-top: 4px; font-size: 11px; color: #94a3b8;">Official AI Candidate Performance & Coaching Report</p>
        </div>
        <div class="score-badge-box">
            <div class="score-num-big">${overallScore}<span style="font-size: 14px; color: #64748b;">/100</span></div>
            <div class="rec-pill">${recommendation}</div>
        </div>
    </div>

    <!-- Executive Summary -->
    <div class="section-card">
        <h3 class="section-title">Executive Performance Summary</h3>
        <p style="font-size: 13px; color: #334155; margin: 0;">${report.summary || ''}</p>
    </div>

    <!-- Competency Breakdown -->
    <div class="section-card">
        <h3 class="section-title">Core Competency Performance Breakdown</h3>
        <div class="grid-2col">
            ${compHtml}
        </div>
    </div>

    <!-- Strengths & Weaknesses -->
    <div class="grid-2col" style="margin-bottom: 18px;">
        <div class="section-card" style="margin-bottom: 0;">
            <h3 class="section-title" style="color: #15803d;">Key Strengths & Mastery</h3>
            <ul style="color: #166534;">
                ${strengthsHtml}
            </ul>
        </div>
        <div class="section-card" style="margin-bottom: 0;">
            <h3 class="section-title" style="color: #b45309;">Priority Areas for Growth & Gaps</h3>
            <ul style="color: #92400e;">
                ${weaknessesHtml}
            </ul>
        </div>
    </div>

    <!-- Actionable Improvement Roadmap -->
    <div class="section-card">
        <h3 class="section-title" style="color: #2563eb;">🚀 Actionable Step-by-Step Improvement Roadmap</h3>
        <p style="font-size: 12px; color: #64748b; margin-top: -8px; margin-bottom: 10px;">Specific recommendations to elevate interview performance to top tier:</p>
        ${roadmapHtml}
    </div>

    <!-- Panel Verdict -->
    <div class="section-card">
        <h3 class="section-title">Hiring Panel Verdict & Closing Guidance</h3>
        <p style="font-size: 13px; color: #334155; margin: 0;">${report.hiring_note || ''}</p>
    </div>

    <!-- Question-by-Question Analysis -->
    <div style="margin-top: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
            Detailed Question-by-Question Evaluation & Model Answers
        </h3>
        ${evalsHtml}
    </div>
</body>
</html>`;
}

function downloadCleanReportPDF() {
    const report = state.currentReport || (state.history.length > 0 ? state.history[0].report : null);
    if (!report) {
        showToast('No active report available to download.');
        return;
    }
    showToast('Preparing clean PDF report...');
    const htmlContent = generateCleanReportHTML(report);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast('Please allow popups to download the PDF report.');
        return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function printCleanReport() {
    downloadCleanReportPDF();
}

function renderRadarChart(metrics) {
    const canvas = document.getElementById('radar-chart-canvas');
    if (!canvas) return;

    if (radarChartInstance) radarChartInstance.destroy();

    const labels = Object.keys(metrics);
    const values = Object.values(metrics);

    radarChartInstance = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Candidate Competency',
                data: values,
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                borderColor: '#f59e0b',
                pointBackgroundColor: '#f59e0b',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#94a3b8', font: { size: 12 } },
                    ticks: { display: false, backdropColor: 'transparent' },
                    min: 0,
                    max: 100
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ── SESSION RECORDING & HISTORY PERSISTENCE ──────────────────────────────────
function playCurrentSessionRecording() {
    if (state.currentSessionVideoBlob) {
        const player = document.getElementById('session-recording-player');
        const url = URL.createObjectURL(state.currentSessionVideoBlob);
        player.src = url;
        document.getElementById('video-download-link').href = url;
        document.getElementById('video-modal-overlay').classList.add('open');
    } else {
        showToast('Session recording in progress or unavailable.');
    }
}

function closeVideoModal() {
    const player = document.getElementById('session-recording-player');
    if (player) player.pause();
    document.getElementById('video-modal-overlay').classList.remove('open');
}

async function saveHistory(sessionRecord) {
    try {
        if (!sessionRecord) return;
        const formData = new FormData();
        const sessionData = {
            id: sessionRecord.id,
            date: sessionRecord.date,
            candidateName: sessionRecord.candidateName,
            jobTitle: sessionRecord.jobTitle,
            score: sessionRecord.score,
            recommendation: sessionRecord.recommendation,
            report: sessionRecord.report
        };
        formData.append('sessionData', JSON.stringify(sessionData));
        
        if (sessionRecord.videoBlob) {
            formData.append('videoBlob', sessionRecord.videoBlob, `${sessionRecord.id}.webm`);
        }
        
        const res = await fetch('/api/history', { method: 'POST', body: formData });
        if (res.ok) {
            console.log("History saved to backend successfully.");
        } else {
            console.error("Failed to save history to backend.");
        }
    } catch (e) {
        console.error("Error in saveHistory:", e);
    }
}

// ── UTILITY TOAST NOTIFICATIONS ──────────────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.95);
            color: #f8fafc;
            border: 1px solid var(--primary-yellow);
            padding: 12px 20px;
            border-radius: var(--radius-md);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-size: 0.88rem;
            z-index: 200;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}


function disableNextButton(disabled, customText) {
    const submitBtn = document.getElementById('btn-submit-answer');
    const endBtn = document.getElementById('btn-end-interview');
    const isLastQ = state.questions && state.currentQuestionIndex === (state.questions.length - 1);

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.textContent = isLastQ ? 'Finish & Submit Answer ✓' : 'Submit Answer & Next →';
    }
    if (endBtn && isLastQ) {
        endBtn.disabled = false;
        endBtn.style.opacity = '1';
        endBtn.style.cursor = 'pointer';
    }
}

async function repeatCurrentQuestion() {
    // Directly read the question text displayed on the candidate's screen!
    const qTextEl = document.getElementById('current-question-text');
    let qText = qTextEl ? qTextEl.textContent.trim() : '';

    if (!qText || qText.includes('Click "Start Question"')) {
        const qObj = (state.questions && state.questions.length > 0) ? state.questions[state.currentQuestionIndex] : null;
        if (qObj && qObj.question) qText = qObj.question;
    }

    if (!qText || qText.includes('Click "Start Question"')) {
        showToast('No active question on screen to repeat.');
        return;
    }

    const btn = document.getElementById('btn-repeat-question');
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'wait';
        btn.textContent = '🔊 Repeating Question...';
    }

    // Stop any existing audio or speech synthesis immediately
    if (currentTTSAudio) {
        try { currentTTSAudio.pause(); } catch(e){}
        currentTTSAudio = null;
    }
    if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch(e){}
    }

    stopMicRecording();
    appendTranscriptMessage('system', 'System', `Repeating question: "${qText}"`);
    disableNextButton(true, '🔊 Agent Repeating Question...');

    try {
        await speakText(qText);
    } catch (err) {
        console.warn('Repeat speakText error:', err);
        // Direct browser fallback if TTS server fails
        fallbackBrowserTTS(qText, () => setAvatarState('speaking'), () => setAvatarState('listening'));
    } finally {
        disableNextButton(false);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.textContent = '🔊 Repeat Question';
        }
        startMicRecording();
    }
}

// ── AI PROCTORING ENGINE ─────────────────────────────────────────────────────
let faceLandmarker = null;
let objectDetector = null;
let isProctoringActive = false;
let proctoringWarningCount = 0;
let proctoringCooldown = 0;
let proctoringLastVideoTime = -1;

// Tab-switching detection
document.addEventListener("visibilitychange", () => {
    if (isProctoringActive && document.visibilityState === 'hidden') {
        triggerProctoringWarning("Tab Switching or Window Minimizing Detected");
    }
});

async function initProctoring() {
    try {
        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3");
        const { FaceLandmarker, ObjectDetector, FilesetResolver } = vision;
        
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
        });
        
        objectDetector = await ObjectDetector.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            scoreThreshold: 0.60
        });
        
        console.log("AI Proctoring Engine Initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize AI Proctoring:", error);
    }
}

function startProctoringLoop() {
    if (!faceLandmarker || !objectDetector) return;
    const videoEl = document.getElementById('candidate-webcam-video');
    if (!videoEl || !videoEl.videoWidth) {
        setTimeout(startProctoringLoop, 500);
        return;
    }

    isProctoringActive = true;
    proctoringWarningCount = 0;
    updateProctoringUI();

    function detectFrame() {
        if (!isProctoringActive) return;

        let startTimeMs = performance.now();
        if (proctoringLastVideoTime !== videoEl.currentTime) {
            proctoringLastVideoTime = videoEl.currentTime;
            
            try {
                if (proctoringCooldown > 0) {
                    proctoringCooldown--;
                } else {
                    // Face Detection for eye-tracking and presence
                    const faceResults = faceLandmarker.detectForVideo(videoEl, startTimeMs);
                    
                    if (faceResults.faceLandmarks) {
                        const numFaces = faceResults.faceLandmarks.length;
                        
                        if (numFaces === 0) {
                            triggerProctoringWarning("Face not detected (Looking away or covered)");
                        } else if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
                            const shapes = faceResults.faceBlendshapes[0].categories;
                            
                            const lookOutLeft = shapes.find(s => s.categoryName === 'eyeLookOutLeft')?.score || 0;
                            const lookOutRight = shapes.find(s => s.categoryName === 'eyeLookOutRight')?.score || 0;
                            const lookUpLeft = shapes.find(s => s.categoryName === 'eyeLookUpLeft')?.score || 0;
                            const lookDownLeft = shapes.find(s => s.categoryName === 'eyeLookDownLeft')?.score || 0;
                            
                            if (lookOutLeft > 0.85 || lookOutRight > 0.85 || lookUpLeft > 0.85 || lookDownLeft > 0.85) {
                                triggerProctoringWarning("Eye Tracking: Looking away from screen");
                            }
                        }
                    }
                    
                    // Object Detection for multiple people in background
                    if (proctoringCooldown <= 0) {
                        const objResults = objectDetector.detectForVideo(videoEl, startTimeMs);
                        if (objResults.detections) {
                            let personCount = 0;
                            for (const detection of objResults.detections) {
                                if (detection.categories.length > 0 && detection.categories[0].categoryName === 'person') {
                                    personCount++;
                                }
                            }
                            if (personCount > 1) {
                                triggerProctoringWarning("Multiple people detected in background");
                            }
                        }
                    }
                }
            } catch (e) {}
        }
        
        if (isProctoringActive) {
            requestAnimationFrame(detectFrame);
        }
    }
    
    detectFrame();
}

function showWarningPopup(reason, current, total) {
    let popup = document.getElementById('warning-popup-notification');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'warning-popup-notification';
        popup.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translate(-50%, -20px);
            opacity: 0;
            background: rgba(239, 68, 68, 0.95);
            color: white;
            border: 2px solid #fca5a5;
            padding: 16px 24px;
            border-radius: var(--radius-md);
            box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
            font-size: 1rem;
            z-index: 1000;
            transition: all 0.3s ease;
            text-align: center;
            min-width: 300px;
            pointer-events: none;
        `;
        document.body.appendChild(popup);
    }
    
    const remaining = total - current;
    popup.innerHTML = `
        <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">⚠️ PROCTORING WARNING ⚠️</div>
        <div style="margin-bottom: 8px;">${reason}</div>
        <div style="font-weight: 700; color: #fee2e2; font-size: 0.9rem;">Warning ${current} of ${total} (${remaining} Remaining)</div>
    `;
    
    // Trigger reflow and show
    void popup.offsetWidth;
    popup.style.opacity = '1';
    popup.style.transform = 'translate(-50%, 0)';
    
    if (popup.hideTimeout) clearTimeout(popup.hideTimeout);
    popup.hideTimeout = setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translate(-50%, -20px)';
    }, 4000);
}

function triggerProctoringWarning(reason) {
    proctoringWarningCount++;
    proctoringCooldown = 150; // Roughly 5 seconds at 30fps
    
    updateProctoringUI();

    showWarningPopup(reason, proctoringWarningCount, 10);

    if (proctoringWarningCount >= 10) {
        showToast("Maximum proctoring warnings exceeded. Interview terminated.");
        isProctoringActive = false;
        
        state.candidateName += " (TERMINATED - PROCTORING)";
        endInterviewSession();
    }
}


function updateProctoringUI() {
    const badge = document.getElementById('proctoring-warning-badge');
    if (badge) {
        badge.textContent = `Warnings: ${proctoringWarningCount}/10`;
        if (proctoringWarningCount > 0) {
            badge.style.background = 'rgba(239, 68, 68, 0.9)';
            badge.style.color = '#fff';
        } else {
            badge.style.background = 'rgba(239, 68, 68, 0.2)';
            badge.style.color = '#fca5a5';
        }
    }
}

function stopProctoringLoop() {
    isProctoringActive = false;
}
function openInstructionsModal() {
    const overlay = document.getElementById('instructions-modal-overlay');
    if (overlay) {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }
}

function closeInstructionsModal() {
    const overlay = document.getElementById('instructions-modal-overlay');
    if (overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }
}
// ─────────────────────────────────────────────────────────────────────────────
