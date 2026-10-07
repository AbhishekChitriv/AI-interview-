/* ============================================================================
   APTITUDE & REASONING ROUND  —  frontend engine (standalone extract)

   Load AFTER aptitude.css and AFTER the HTML fragments from aptitude.html
   are in the page:  <script src="/static/aptitude.js"></script>

   Public entry points (wire these to your UI / router):
     startAssessment()          - begins the flow (called by #btn-start-assessment)
     renderAssessmentPanels()   - call when your "assessment" tab becomes visible
     submitAssessment()         - SUBMIT TEST button
     restartAssessment()        - "Take a New Assessment" button

   Router guard: in your switchNavTab(), before leaving the assessment tab while
   a test is live, replicate lines from the ORIGINAL app.js switchNavTab():
       if (leavingAssessment && assessmentState.phase === 'live') {
           if (!confirm('Leaving this page will end your assessment. Continue?')) return;
           stopAssessmentTimer(); stopAssessmentProctoring();
           assessmentState.phase = 'intro'; renderAssessmentPanels();
       }
   ============================================================================ */

// ── Host integration shim ───────────────────────────────────────────────────
// The assessment reads a few fields from a global `state`. If your app already
// defines `state`, you can delete this block - just keep the paths populated.
window.state = window.state || {};
state.jobTitle         = state.jobTitle         || '';
state.candidateName    = state.candidateName    || 'Candidate';
state.candidateProfile = state.candidateProfile || null;
state.settings         = state.settings         || {};
state.settings.groqKey = state.settings.groqKey || '';   // optional - backend falls back to env, then to a curated question bank
state.currentTab       = state.currentTab       || '';

// ── Shared globals (also used by the interview proctor in the full app) ──────
let webcamStream = window.__aptitudeWebcamStream || null;
let faceLandmarker = null;
let objectDetector = null;
let isProctoringActive = false;   // set by the interview round in the full app; harmless here

// ── AI proctoring model loader (optional; camera AI degrades gracefully) ─────
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

// ── Toast notifications ─────────────────────────────────────────────────────
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
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.style.pointerEvents = 'none';
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

// ── Proctoring warning popup ────────────────────────────────────────────────
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

// ── Draggable proctoring camera (assessment) ─────────────────────────────
function initProctorCamDrag() {
    const cam = document.getElementById('assess-proctor-cam');
    const handle = cam ? cam.querySelector('.assess-proctor-head') : null;
    if (!cam || !handle) return;

    function getBounds() {
        const camWidth = cam.offsetWidth || 230;
        const camHeight = cam.offsetHeight || 220;
        const minX = 10;
        const maxX = Math.max(minX, window.innerWidth - camWidth - 10);
        const minY = 65; // Below header bar
        const maxY = Math.max(minY, window.innerHeight - camHeight - 65); // Above footer bar
        return { camWidth, camHeight, minX, maxX, minY, maxY };
    }

    function setPosition(x, y, save = true) {
        const { minX, maxX, minY, maxY } = getBounds();
        const clampedX = Math.round(Math.min(Math.max(x, minX), maxX));
        const clampedY = Math.round(Math.min(Math.max(y, minY), maxY));

        cam.style.left = clampedX + 'px';
        cam.style.top = clampedY + 'px';
        cam.style.right = 'auto';
        cam.style.bottom = 'auto';

        if (save) {
            try {
                localStorage.setItem('proctorCamPos', JSON.stringify({ x: clampedX, y: clampedY }));
            } catch (e) {}
        }
    }

    function getDefaultPosition() {
        const { camWidth, camHeight, minX, maxX, minY, maxY } = getBounds();
        const defaultTop = Math.round(Math.min(Math.max((window.innerHeight - camHeight) / 2, minY), maxY));
        const defaultLeft = Math.round(Math.min(Math.max(window.innerWidth - camWidth - 24, minX), maxX));
        return { left: defaultLeft, top: defaultTop };
    }

    function reposition(resetToDefault = false) {
        if (resetToDefault) {
            try { localStorage.removeItem('proctorCamPos'); } catch (e) {}
            const def = getDefaultPosition();
            setPosition(def.left, def.top, true);
            return;
        }

        try {
            const saved = JSON.parse(localStorage.getItem('proctorCamPos') || 'null');
            const { minY, maxY, minX, maxX } = getBounds();
            if (saved && typeof saved.x === 'number' && typeof saved.y === 'number' &&
                saved.y >= minY && saved.y <= maxY && saved.x >= minX && saved.x <= maxX) {
                setPosition(saved.x, saved.y, false);
            } else {
                const def = getDefaultPosition();
                setPosition(def.left, def.top, false);
            }
        } catch (e) {
            const def = getDefaultPosition();
            setPosition(def.left, def.top, false);
        }
    }

    window.repositionAssessProctorCam = reposition;

    if (cam.dataset.dragInitialized === 'true') {
        reposition(false);
        return;
    }
    cam.dataset.dragInitialized = 'true';

    let dragging = false;
    let startPointerX = 0, startPointerY = 0;
    let startCamLeft = 0, startCamTop = 0;

    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        cam.classList.add('dragging');
        document.body.classList.add('cam-is-dragging');

        const rect = cam.getBoundingClientRect();
        startPointerX = e.clientX;
        startPointerY = e.clientY;
        startCamLeft = rect.left;
        startCamTop = rect.top;

        if (handle.setPointerCapture && e.pointerId !== undefined) {
            try { handle.setPointerCapture(e.pointerId); } catch (err) {}
        }
        e.preventDefault();
        e.stopPropagation();
    }

    function onPointerMove(e) {
        if (!dragging) return;
        const deltaX = e.clientX - startPointerX;
        const deltaY = e.clientY - startPointerY;
        setPosition(startCamLeft + deltaX, startCamTop + deltaY, false);
    }

    function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        cam.classList.remove('dragging');
        document.body.classList.remove('cam-is-dragging');

        if (handle.releasePointerCapture && e.pointerId !== undefined) {
            try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        const rect = cam.getBoundingClientRect();
        setPosition(rect.left, rect.top, true);
    }

    handle.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Double-click handle to reset back to middle of screen
    handle.addEventListener('dblclick', () => {
        reposition(true);
    });

    // Keep camera within bounds when resizing window
    window.addEventListener('resize', () => {
        const rect = cam.getBoundingClientRect();
        if (rect.width > 0) {
            setPosition(rect.left, rect.top, true);
        }
    });

    reposition(false);
}

// ══════════════════════════════════════════════════════════════════════════
// ── APTITUDE & REASONING ASSESSMENT ─────────────────────────────────────────
const ASSESSMENT_DURATION_SECONDS = 30 * 60;
const ASSESSMENT_MAX_WARNINGS = 10;

const assessmentState = {
    questions: [],
    answers: {},            // { "<id>": <selected option index> }
    review: {},             // { "<id>": true } marked for review
    warnings: 0,            // proctoring violations counted
    currentIndex: 0,
    remainingSeconds: ASSESSMENT_DURATION_SECONDS,
    timerInterval: null,
    startedAt: null,
    result: null,
    phase: 'intro'          // 'intro' | 'live' | 'results'
};

// ── Assessment proctoring engine (reuses the MediaPipe models loaded by initProctoring) ──
let assessProctorActive = false;
let assessProctorRAF = null;
let assessProctorCooldown = 0;
let assessProctorLastVideoTime = -1;

async function startAssessmentProctoring() {
    const video = document.getElementById('assess-webcam-video');
    const statusEl = document.getElementById('assess-proctor-status');
    try {
        if (!webcamStream) {
            webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (video) video.srcObject = webcamStream;
        if (statusEl) {
            statusEl.textContent = (faceLandmarker && objectDetector)
                ? 'Monitoring — face, devices & tab activity'
                : 'Monitoring tab activity (camera AI unavailable)';
        }
    } catch (e) {
        console.warn('Assessment camera unavailable:', e);
        if (statusEl) statusEl.textContent = 'Camera blocked — enable it to stay compliant';
        showToast('Camera access is required for this proctored assessment.');
    }
    assessProctorActive = true;
    assessProctorCooldown = 45; // grace period on start (~1.5s)
    assessProctorLastVideoTime = -1;
    assessProctorLoop();
}

function stopAssessmentProctoring() {
    assessProctorActive = false;
    if (assessProctorRAF) { cancelAnimationFrame(assessProctorRAF); assessProctorRAF = null; }
    const video = document.getElementById('assess-webcam-video');
    if (video) video.srcObject = null;
    // Only release the shared camera stream if the interview proctor isn't using it.
    if (webcamStream && !isProctoringActive) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
    }
}

function assessProctorLoop() {
    if (!assessProctorActive) return;
    const video = document.getElementById('assess-webcam-video');

    if (video && video.videoWidth && faceLandmarker && objectDetector
        && assessProctorLastVideoTime !== video.currentTime) {
        assessProctorLastVideoTime = video.currentTime;
        const now = performance.now();
        try {
            if (assessProctorCooldown > 0) {
                assessProctorCooldown--;
            } else {
                const face = faceLandmarker.detectForVideo(video, now);
                const faceCount = face.faceLandmarks ? face.faceLandmarks.length : 0;
                if (faceCount === 0) {
                    assessmentProctorWarn('Face not visible in the camera');
                } else if (face.faceBlendshapes && face.faceBlendshapes[0]) {
                    const cats = face.faceBlendshapes[0].categories;
                    const g = (n) => (cats.find(c => c.categoryName === n)?.score || 0);
                    if (g('eyeLookOutLeft') > 0.85 || g('eyeLookOutRight') > 0.85 ||
                        g('eyeLookUpLeft') > 0.85 || g('eyeLookDownLeft') > 0.85) {
                        assessmentProctorWarn('Looking away from the screen');
                    }
                }

                if (assessProctorCooldown <= 0) {
                    const obj = objectDetector.detectForVideo(video, now);
                    let persons = 0;
                    const gadgets = new Set();
                    const BANNED = ['cell phone', 'laptop', 'book', 'tv', 'remote', 'keyboard', 'tablet'];
                    for (const d of (obj.detections || [])) {
                        const name = (d.categories && d.categories[0] && d.categories[0].categoryName) || '';
                        if (name === 'person') persons++;
                        else if (BANNED.includes(name)) gadgets.add(name);
                    }
                    if (persons > 1) assessmentProctorWarn('Another person detected in the frame');
                    if (gadgets.size) assessmentProctorWarn('Prohibited device detected: ' + [...gadgets].join(', '));
                }
            }
        } catch (e) { /* transient MediaPipe frame errors are safe to ignore */ }
    }

    assessProctorRAF = requestAnimationFrame(assessProctorLoop);
}

function assessmentProctorWarn(reason) {
    if (assessmentState.phase !== 'live') return;
    assessmentState.warnings++;
    assessProctorCooldown = 150; // ~5s debounce before the next check
    updateAssessmentWarnBadge();

    if (typeof showWarningPopup === 'function') {
        showWarningPopup(reason, assessmentState.warnings, ASSESSMENT_MAX_WARNINGS);
    }
    const statusEl = document.getElementById('assess-proctor-status');
    if (statusEl) statusEl.textContent = `⚠ ${reason}`;

    if (assessmentState.warnings >= ASSESSMENT_MAX_WARNINGS) {
        showToast('Maximum proctoring warnings reached — submitting your assessment.');
        submitAssessment(true);
    }
}

function updateAssessmentWarnBadge() {
    const el = document.getElementById('assess-proctor-warns');
    if (el) el.textContent = `Warnings: ${assessmentState.warnings}/${ASSESSMENT_MAX_WARNINGS}`;
    const cam = document.getElementById('assess-proctor-cam');
    if (cam) cam.classList.toggle('warned', assessmentState.warnings > 0);
}

// Tab / window switching during a live assessment
document.addEventListener('visibilitychange', () => {
    if (assessmentState.phase === 'live' && document.visibilityState === 'hidden') {
        assessmentProctorWarn('Tab switch or window minimised');
    }
});

// Resolve the candidate's display name: parsed resume first, then the
// setup form field, then the last known name, then a sensible default.
function resolveCandidateName() {
    const fromResume = (state.candidateProfile && state.candidateProfile.name || '').trim();
    if (fromResume && fromResume.toLowerCase() !== 'candidate') return fromResume;

    const fromField = (document.getElementById('candidate-name-input')?.value || '').trim();
    if (fromField && fromField.toLowerCase() !== 'candidate') return fromField;

    const fromState = (state.candidateName || '').trim();
    if (fromState && fromState.toLowerCase() !== 'candidate') return fromState;

    return 'Candidate';
}

function fmtClock(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const rr = String(r).padStart(2, '0');
    return `${hh}:${mm}:${rr}`;
}

function renderAssessmentPanels() {
    const intro = document.getElementById('assessment-intro');
    const live = document.getElementById('assessment-live');
    const results = document.getElementById('assessment-results');
    if (intro) intro.style.display = assessmentState.phase === 'intro' ? '' : 'none';
    if (live) live.style.display = assessmentState.phase === 'live' ? '' : 'none';
    if (results) results.style.display = assessmentState.phase === 'results' ? '' : 'none';

    const infoTime = document.getElementById('assess-info-time');
    if (infoTime) infoTime.textContent = fmtClock(ASSESSMENT_DURATION_SECONDS);
}

async function startAssessment() {
    const btn = document.getElementById('btn-start-assessment');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating questions…'; }
    showToast('Generating your aptitude & reasoning assessment…');

    try {
        const res = await fetch('/api/assessment/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                target_role: state.jobTitle || null,
                candidate_name: resolveCandidateName(),
                groq_api_key: state.settings.groqKey || null
            })
        });
        const data = await res.json();
        if (!res.ok || !data.questions || data.questions.length === 0) {
            throw new Error(data.detail || 'No questions returned');
        }

        assessmentState.questions = data.questions;
        assessmentState.answers = {};
        assessmentState.review = {};
        assessmentState.warnings = 0;
        assessmentState.currentIndex = 0;
        assessmentState.remainingSeconds = ASSESSMENT_DURATION_SECONDS;
        assessmentState.result = null;

        // Show the rules & proctoring notice before the test actually begins.
        openAssessmentInstructions();
    } catch (e) {
        console.error('Assessment start error:', e);
        showToast('Could not start the assessment. Please try again.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="icon-lg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg> Start Assessment'; }
    }
}

function openAssessmentInstructions() {
    const o = document.getElementById('assessment-instructions-overlay');
    if (o) {
        o.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }
}

function cancelAssessmentStart() {
    const o = document.getElementById('assessment-instructions-overlay');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (assessmentState.phase !== 'live') {
        assessmentState.questions = [];
        renderAssessmentPanels();
    }
}

async function confirmAssessmentStart() {
    const o = document.getElementById('assessment-instructions-overlay');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (!assessmentState.questions.length) return;

    assessmentState.startedAt = Date.now();
    assessmentState.phase = 'live';

    const candEl = document.getElementById('exam-cand-name');
    if (candEl) {
        candEl.textContent = 'Candidate Name: ';
        const nm = document.createElement('strong');
        nm.textContent = resolveCandidateName();
        candEl.appendChild(nm);
    }

    renderAssessmentPanels();
    renderAssessmentQuestion();
    renderAssessmentPalette();
    updateAssessmentWarnBadge();
    startAssessmentTimer();
    await startAssessmentProctoring();
    showToast('Assessment started. Good luck!');
}

function startAssessmentTimer() {
    stopAssessmentTimer();
    const timerEl = document.getElementById('assess-timer');
    const tick = () => {
        assessmentState.remainingSeconds--;
        if (timerEl) {
            timerEl.textContent = fmtClock(assessmentState.remainingSeconds);
            timerEl.classList.toggle('assessment-timer--low', assessmentState.remainingSeconds <= 120);
        }
        if (assessmentState.remainingSeconds <= 0) {
            stopAssessmentTimer();
            showToast('Time is up — submitting your assessment.');
            submitAssessment(true);
        }
    };
    if (timerEl) timerEl.textContent = fmtClock(assessmentState.remainingSeconds);
    assessmentState.timerInterval = setInterval(tick, 1000);
}

function stopAssessmentTimer() {
    if (assessmentState.timerInterval) {
        clearInterval(assessmentState.timerInterval);
        assessmentState.timerInterval = null;
    }
}

function renderAssessmentQuestion() {
    const q = assessmentState.questions[assessmentState.currentIndex];
    if (!q) return;
    const total = assessmentState.questions.length;
    const idx = assessmentState.currentIndex;
    const qId = String(q.id);

    document.getElementById('assess-section-tag').textContent = q.category || (q.type === 'reasoning' ? 'Logical Reasoning' : 'Quantitative Aptitude');
    const progEl = document.getElementById('assess-progress-tag');
    if (progEl) progEl.textContent = `Question ${idx + 1} of ${total}`;
    document.getElementById('assess-q-subtopic').textContent = q.subtopic || 'General';
    document.getElementById('assess-question-text').textContent = q.question || '';

    const optsBox = document.getElementById('assess-options');
    optsBox.innerHTML = '';
    (q.options || []).forEach((opt, oIdx) => {
        const selected = assessmentState.answers[qId] === oIdx;
        const label = document.createElement('label');
        label.className = 'exam-option' + (selected ? ' selected' : '');
        label.innerHTML = `<input type="radio" name="exam-opt-${qId}" ${selected ? 'checked' : ''}>`
            + `<span class="exam-option-key">(${String.fromCharCode(65 + oIdx)})</span>`
            + `<span class="exam-option-text"></span>`;
        label.querySelector('.exam-option-text').textContent = opt;
        label.querySelector('input').addEventListener('change', () => selectAssessmentOption(oIdx));
        optsBox.appendChild(label);
    });

    const reviewBtn = document.getElementById('btn-assess-review');
    if (reviewBtn) {
        const marked = !!assessmentState.review[qId];
        reviewBtn.classList.toggle('active', marked);
        reviewBtn.textContent = marked ? 'UNMARK REVIEW' : 'MARK FOR REVIEW';
    }

    renderAssessmentPalette();
}

function selectAssessmentOption(optionIndex) {
    const q = assessmentState.questions[assessmentState.currentIndex];
    if (!q) return;
    assessmentState.answers[String(q.id)] = optionIndex;
    renderAssessmentQuestion();

    const total = assessmentState.questions.length;
    const answeredCount = Object.keys(assessmentState.answers).length;
    if (answeredCount === total) {
        showToast(`All ${total} questions answered! Click "Save & Next" or "Submit Test" to finish.`);
    }
}

function assessmentClearAnswer() {
    const q = assessmentState.questions[assessmentState.currentIndex];
    if (!q) return;
    delete assessmentState.answers[String(q.id)];
    renderAssessmentQuestion();
}

function assessmentToggleReview() {
    const q = assessmentState.questions[assessmentState.currentIndex];
    if (!q) return;
    const qId = String(q.id);
    if (assessmentState.review[qId]) delete assessmentState.review[qId];
    else assessmentState.review[qId] = true;
    renderAssessmentQuestion();
}

function assessmentSaveNext() {
    const total = assessmentState.questions.length;
    if (assessmentState.currentIndex < total - 1) {
        assessmentState.currentIndex++;
        renderAssessmentQuestion();
    } else {
        // Last question reached
        const answeredCount = Object.keys(assessmentState.answers).length;
        if (answeredCount === total) {
            if (confirm(`You have answered all ${total} questions! Do you want to submit your assessment now?`)) {
                submitAssessment(true);
            }
        } else {
            const unanswered = total - answeredCount;
            if (confirm(`You are on the last question (${unanswered} question${unanswered > 1 ? 's' : ''} not yet answered). Do you want to submit the assessment now?`)) {
                submitAssessment(true);
            }
        }
    }
}

function assessmentNext() {
    if (assessmentState.currentIndex < assessmentState.questions.length - 1) {
        assessmentState.currentIndex++;
        renderAssessmentQuestion();
    }
}

function assessmentPrev() {
    if (assessmentState.currentIndex > 0) {
        assessmentState.currentIndex--;
        renderAssessmentQuestion();
    }
}

function assessmentGoto(i) {
    if (i >= 0 && i < assessmentState.questions.length) {
        assessmentState.currentIndex = i;
        renderAssessmentQuestion();
    }
}

function renderAssessmentPalette() {
    const palette = document.getElementById('assess-palette');
    if (!palette) return;
    palette.innerHTML = '';
    assessmentState.questions.forEach((q, i) => {
        const qId = String(q.id);
        const answered = qId in assessmentState.answers;
        const marked = !!assessmentState.review[qId];
        let stateClass = 'pal-not';
        if (marked) stateClass = 'pal-review';
        else if (answered) stateClass = 'pal-answered';
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'exam-pal-cell ' + stateClass
            + (i === assessmentState.currentIndex ? ' pal-current' : '');
        cell.textContent = i + 1;
        cell.onclick = () => assessmentGoto(i);
        palette.appendChild(cell);
    });
}

async function submitAssessment(auto = false) {
    if (assessmentState.phase !== 'live') return;
    const total = assessmentState.questions.length;
    const answeredCount = Object.keys(assessmentState.answers).length;
    const unanswered = total - answeredCount;

    if (!auto) {
        if (unanswered > 0) {
            if (!confirm(`You have answered ${answeredCount} of ${total} question(s) (${unanswered} unanswered). Are you sure you want to submit?`)) return;
        } else {
            if (!confirm(`You have answered all ${total} questions! Are you sure you want to submit your assessment?`)) return;
        }
    }

    stopAssessmentTimer();
    stopAssessmentProctoring();
    const timeTaken = assessmentState.startedAt
        ? Math.round((Date.now() - assessmentState.startedAt) / 1000)
        : (ASSESSMENT_DURATION_SECONDS - assessmentState.remainingSeconds);

    showToast('Scoring your assessment…');

    try {
        const res = await fetch('/api/assessment/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: assessmentState.answers,
                questions: assessmentState.questions,
                time_taken_seconds: timeTaken
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Evaluation failed');
        assessmentState.result = data;
        assessmentState.phase = 'results';
        renderAssessmentPanels();
        renderAssessmentResults();
    } catch (e) {
        console.error('Assessment submit error:', e);
        showToast('Could not score the assessment. Please try again.');
        startAssessmentTimer();
        startAssessmentProctoring();
    }
}

function renderAssessmentResults() {
    const r = assessmentState.result;
    if (!r) return;

    document.getElementById('assess-result-name').textContent = resolveCandidateName();
    document.getElementById('assess-result-verdict').textContent = r.verdict || 'Assessment Complete';
    const flagsTxt = assessmentState.warnings > 0 ? ` • Proctoring flags: ${assessmentState.warnings}` : '';
    document.getElementById('assess-result-time').textContent = `Time taken: ${fmtClock(r.time_taken_seconds || 0)}${flagsTxt}`;
    document.getElementById('assess-result-score').textContent = Math.round(r.score_percentage || 0);
    document.getElementById('assess-result-correct').textContent = `${r.correct_answers || 0} / ${r.total_questions || 0} correct`;
    document.getElementById('assess-result-summary').textContent = r.summary || '';

    const grid = document.getElementById('assess-breakdown-grid');
    grid.innerHTML = '';
    const sections = [
        { title: 'Quantitative Aptitude', d: r.aptitude },
        { title: 'Logical Reasoning', d: r.reasoning }
    ];
    sections.forEach(({ title, d }) => {
        if (!d) return;
        const card = document.createElement('div');
        card.className = 'assessment-breakdown-card';
        card.innerHTML = `
            <div class="assessment-breakdown-head">
                <span>${title}</span>
                <strong>${d.correct || 0} / ${d.total || 0}</strong>
            </div>
            <div class="assessment-breakdown-bar">
                <div class="assessment-breakdown-fill" style="width: ${d.percentage || 0}%;"></div>
            </div>
        `;
        grid.appendChild(card);
    });

    const list = document.getElementById('assess-review-list');
    list.innerHTML = '';
    (r.detailed_review || []).forEach((item, i) => {
        const correct = item.is_correct;
        const userAns = item.user_selected_answer && item.user_selected_answer !== 'Not Attempted'
            ? item.user_selected_answer : 'Not attempted';
        const card = document.createElement('div');
        card.className = 'assessment-review-item ' + (correct ? 'review-correct' : 'review-wrong');
        const head = document.createElement('div');
        head.className = 'assessment-review-head';
        head.innerHTML = `
            <span class="badge ${correct ? 'badge-green' : 'badge-red'}">${correct ? '✓ Correct' : '✗ Incorrect'}</span>
            <span class="badge badge-purple">Q${item.id} • ${item.category || ''}</span>
        `;
        const q = document.createElement('p');
        q.className = 'assessment-review-question';
        q.textContent = item.question || '';
        const ans = document.createElement('div');
        ans.className = 'assessment-review-answers';
        ans.innerHTML = `
            <span>Your answer: <strong class="${correct ? 'text-green' : 'text-amber'}"></strong></span>
            <span>Correct answer: <strong class="text-green"></strong></span>
        `;
        ans.querySelectorAll('strong')[0].textContent = userAns;
        ans.querySelectorAll('strong')[1].textContent = item.correct_answer || '';
        const exp = document.createElement('p');
        exp.className = 'assessment-review-explanation';
        exp.textContent = item.explanation || '';

        card.appendChild(head);
        card.appendChild(q);
        card.appendChild(ans);
        card.appendChild(exp);
        list.appendChild(card);
    });
}

function restartAssessment() {
    stopAssessmentTimer();
    stopAssessmentProctoring();
    assessmentState.questions = [];
    assessmentState.answers = {};
    assessmentState.review = {};
    assessmentState.warnings = 0;
    assessmentState.currentIndex = 0;
    assessmentState.remainingSeconds = ASSESSMENT_DURATION_SECONDS;
    assessmentState.result = null;
    assessmentState.phase = 'intro';
    renderAssessmentPanels();
}

// Warn candidate if they navigate away mid-assessment
window.addEventListener('beforeunload', (e) => {
    if (assessmentState.phase === 'live') {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initProctoring === 'function') initProctoring();       // load MediaPipe models (optional)
    if (typeof initProctorCamDrag === 'function') initProctorCamDrag();
    if (typeof renderAssessmentPanels === 'function') renderAssessmentPanels();
});
