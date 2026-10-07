/* ==========================================================================
   Standalone Coding Round — extracted from AI_Interview_Live
   Editing only. There is deliberately no "Run" action anywhere in this app.
   ========================================================================== */

// ── Local session state (replaces the platform-wide `state` object) ────────
const state = {
    resumeText: '',
    jdText: '',
    jobTitle: '',
    candidateName: 'Candidate',
    groqKey: ''
};

function resolveCandidateName() {
    const n = (state.candidateName || '').trim();
    return (n && n.toLowerCase() !== 'candidate') ? n : 'Candidate';
}

function fmtClock(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// ── Toast + warning popup ─────────────────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px;
            background: rgba(15, 23, 42, 0.95); color: #f8fafc;
            border: 1px solid var(--primary-yellow); padding: 12px 20px;
            border-radius: var(--radius-md); box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-size: 0.88rem; z-index: 200; transition: all 0.3s ease; pointer-events: none;`;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

function showWarningPopup(reason, current, total) {
    let popup = document.getElementById('warning-popup-notification');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'warning-popup-notification';
        popup.style.cssText = `
            position: fixed; top: 24px; left: 50%;
            transform: translate(-50%, -20px); opacity: 0;
            background: rgba(239, 68, 68, 0.95); color: white;
            border: 2px solid #fca5a5; padding: 16px 24px;
            border-radius: var(--radius-md); box-shadow: 0 10px 30px rgba(239, 68, 68, 0.3);
            font-size: 1rem; z-index: 1000; transition: all 0.3s ease;
            text-align: center; min-width: 300px; pointer-events: none;`;
        document.body.appendChild(popup);
    }
    const remaining = total - current;
    popup.innerHTML = `
        <div style="font-weight:700;font-size:1.1rem;margin-bottom:4px;">&#9888;&#65039; PROCTORING WARNING &#9888;&#65039;</div>
        <div style="margin-bottom:8px;">${reason}</div>
        <div style="font-weight:700;color:#fee2e2;font-size:0.9rem;">Warning ${current} of ${total} (${remaining} Remaining)</div>`;
    void popup.offsetWidth;
    popup.style.opacity = '1';
    popup.style.transform = 'translate(-50%, 0)';
    if (popup.hideTimeout) clearTimeout(popup.hideTimeout);
    popup.hideTimeout = setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'translate(-50%, -20px)';
    }, 4000);
}

// ── Draggable proctoring camera ──────────────────────────────────────────
function initProctorCamDrag() {
    const cam = document.getElementById('coding-proctor-cam');
    if (!cam) return;
    const headHandle = cam.querySelector('.assess-proctor-head');
    const statusHandle = cam.querySelector('.assess-proctor-status');

    function getBounds() {
        const camWidth = cam.offsetWidth || 230;
        const camHeight = cam.offsetHeight || 220;
        const minX = 10;
        const maxX = Math.max(minX, window.innerWidth - camWidth - 10);
        const minY = 90; // Safely below the 55px top navigation bar
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
                localStorage.setItem('codingProctorCamPos', JSON.stringify({ left: clampedX, top: clampedY }));
            } catch (e) {}
        }
    }

    function getDefaultPosition() {
        const { camWidth, camHeight, minX, maxX, minY, maxY } = getBounds();
        // Position camera in vertical middle on the right side of the screen
        const defaultTop = Math.round(Math.min(Math.max((window.innerHeight - camHeight) / 2, minY), maxY));
        const defaultLeft = Math.round(Math.min(Math.max(window.innerWidth - camWidth - 24, minX), maxX));
        return { left: defaultLeft, top: defaultTop };
    }

    function reposition(resetToDefault = false) {
        if (resetToDefault) {
            try { localStorage.removeItem('codingProctorCamPos'); } catch (e) {}
            const def = getDefaultPosition();
            setPosition(def.left, def.top, true);
            return;
        }

        try {
            const saved = JSON.parse(localStorage.getItem('codingProctorCamPos') || 'null');
            const { minY, maxY, minX, maxX } = getBounds();
            // If saved position is stuck at top (< 90px) or out of bounds, reset to middle
            if (saved && typeof saved.left === 'number' && typeof saved.top === 'number' &&
                saved.top >= minY && saved.top <= maxY && saved.left >= minX && saved.left <= maxX) {
                setPosition(saved.left, saved.top, false);
            } else {
                const def = getDefaultPosition();
                setPosition(def.left, def.top, false);
            }
        } catch (e) {
            const def = getDefaultPosition();
            setPosition(def.left, def.top, false);
        }
    }

    window.repositionCodingProctorCam = reposition;

    if (cam.dataset.dragInitialized === 'true') {
        reposition(false);
        return;
    }
    cam.dataset.dragInitialized = 'true';

    let dragging = false;
    let startPointerX = 0, startPointerY = 0;
    let startCamLeft = 0, startCamTop = 0;
    let activePointerHandle = null;

    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.target.closest('.assess-proctor-center-btn')) return;

        dragging = true;
        activePointerHandle = e.currentTarget;
        cam.classList.add('dragging');
        document.body.classList.add('cam-is-dragging');

        const rect = cam.getBoundingClientRect();
        startPointerX = e.clientX;
        startPointerY = e.clientY;
        startCamLeft = rect.left;
        startCamTop = rect.top;

        if (activePointerHandle && activePointerHandle.setPointerCapture && e.pointerId !== undefined) {
            try { activePointerHandle.setPointerCapture(e.pointerId); } catch (err) {}
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

        if (activePointerHandle && activePointerHandle.releasePointerCapture && e.pointerId !== undefined) {
            try { activePointerHandle.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        activePointerHandle = null;

        const rect = cam.getBoundingClientRect();
        setPosition(rect.left, rect.top, true);
    }

    [headHandle, statusHandle].forEach(h => {
        if (!h) return;
        h.addEventListener('pointerdown', onPointerDown);
        h.addEventListener('dblclick', () => reposition(true));
    });

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Keep camera within bounds when resizing window
    window.addEventListener('resize', () => {
        const rect = cam.getBoundingClientRect();
        if (rect.width > 0) {
            setPosition(rect.left, rect.top, true);
        }
    });

    reposition(false);
}

// ── AI Proctoring engine (MediaPipe tasks-vision) ────────────────────────
let webcamStream = null;
let faceLandmarker = null;
let objectDetector = null;

document.addEventListener('visibilitychange', () => {
    if (codingState.phase === 'live' && document.visibilityState === 'hidden') {
        codingProctorWarn('Tab switch or window minimised');
    }
});

async function initProctoring() {
    try {
        const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
        const { FaceLandmarker, ObjectDetector, FilesetResolver } = vision;
        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU'
            },
            outputFaceBlendshapes: true,
            runningMode: 'VIDEO',
            numFaces: 1
        });
        objectDetector = await ObjectDetector.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            scoreThreshold: 0.60
        });
        console.log('AI Proctoring Engine Initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize AI Proctoring:', error);
    }
}

// ── Coding round proctoring loop ────────────────────────────────────────
let codingProctorActive = false;
let codingProctorRAF = null;
let codingProctorCooldown = 0;
let codingProctorLastVideoTime = -1;

async function startCodingProctoring() {
    const video = document.getElementById('coding-webcam-video');
    const statusEl = document.getElementById('coding-proctor-status');
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
        console.warn('Coding camera unavailable:', e);
        if (statusEl) statusEl.textContent = 'Camera blocked — enable it to stay compliant';
        showToast('Camera access is required for this proctored coding challenge.');
    }
    codingProctorActive = true;
    codingProctorCooldown = 45;
    codingProctorLastVideoTime = -1;
    codingProctorLoop();
}

function stopCodingProctoring() {
    codingProctorActive = false;
    if (codingProctorRAF) { cancelAnimationFrame(codingProctorRAF); codingProctorRAF = null; }
    const video = document.getElementById('coding-webcam-video');
    if (video) video.srcObject = null;
    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
        webcamStream = null;
    }
}

function codingProctorLoop() {
    if (!codingProctorActive) return;
    const video = document.getElementById('coding-webcam-video');

    if (video && video.videoWidth && faceLandmarker && objectDetector
        && codingProctorLastVideoTime !== video.currentTime) {
        codingProctorLastVideoTime = video.currentTime;
        const now = performance.now();
        try {
            if (codingProctorCooldown > 0) {
                codingProctorCooldown--;
            } else {
                const face = faceLandmarker.detectForVideo(video, now);
                const faceCount = face.faceLandmarks ? face.faceLandmarks.length : 0;
                if (faceCount === 0) {
                    codingProctorWarn('Face not visible in the camera');
                } else if (face.faceBlendshapes && face.faceBlendshapes[0]) {
                    const cats = face.faceBlendshapes[0].categories;
                    const g = (n) => (cats.find(c => c.categoryName === n)?.score || 0);
                    if (g('eyeLookOutLeft') > 0.85 || g('eyeLookOutRight') > 0.85 ||
                        g('eyeLookUpLeft') > 0.85 || g('eyeLookDownLeft') > 0.85) {
                        codingProctorWarn('Looking away from the screen');
                    }
                }

                if (codingProctorCooldown <= 0) {
                    const obj = objectDetector.detectForVideo(video, now);
                    let persons = 0;
                    const gadgets = new Set();
                    const BANNED = ['cell phone', 'laptop', 'book', 'tv', 'remote', 'keyboard', 'tablet'];
                    for (const d of (obj.detections || [])) {
                        const name = (d.categories && d.categories[0] && d.categories[0].categoryName) || '';
                        if (name === 'person') persons++;
                        else if (BANNED.includes(name)) gadgets.add(name);
                    }
                    if (persons > 1) codingProctorWarn('Another person detected in the frame');
                    if (gadgets.size) codingProctorWarn('Prohibited device detected: ' + [...gadgets].join(', '));
                }
            }
        } catch (e) { /* transient MediaPipe frame errors */ }
    }

    codingProctorRAF = requestAnimationFrame(codingProctorLoop);
}

function codingProctorWarn(reason) {
    if (codingState.phase !== 'live') return;
    codingState.warnings++;
    codingProctorCooldown = 150;
    updateCodingWarnBadge();

    showWarningPopup(reason, codingState.warnings, CODING_MAX_WARNINGS);
    const statusEl = document.getElementById('coding-proctor-status');
    if (statusEl) statusEl.textContent = `⚠ ${reason}`;

    if (codingState.warnings >= CODING_MAX_WARNINGS) {
        showToast('Maximum proctoring warnings reached — submitting your coding round.');
        submitCodingRound(true);
    }
}

function updateCodingWarnBadge() {
    const el = document.getElementById('coding-proctor-warns');
    if (el) el.textContent = `Warnings: ${codingState.warnings}/${CODING_MAX_WARNINGS}`;
    const cam = document.getElementById('coding-proctor-cam');
    if (cam) cam.classList.toggle('warned', codingState.warnings > 0);
}

// ── CODING ROUND ────────────────────────────────────────────────────────
const CODING_DURATION_SECONDS = 60 * 60; // 1 hour
const CODING_MAX_WARNINGS = 10;

const codingState = {
    questions: [],
    code: {},
    warnings: 0,
    currentIndex: 0,
    remainingSeconds: CODING_DURATION_SECONDS,
    timerInterval: null,
    startedAt: null,
    result: null,
    phase: 'intro'      // 'intro' | 'live' | 'results'
};

// ── Monaco Editor (VS Code's editor) — editing only, no execution ────────
let monacoEditorInstance = null;
let monacoLoadPromise = null;

function ensureMonacoLoaded() {
    if (monacoLoadPromise) return monacoLoadPromise;
    monacoLoadPromise = new Promise((resolve, reject) => {
        if (typeof require === 'undefined' || !window.require) {
            reject(new Error('Monaco loader script not available'));
            return;
        }
        require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
        require(['vs/editor/editor.main'], () => resolve(), reject);
    });
    return monacoLoadPromise;
}

function monacoLanguageFor(lang) {
    const l = (lang || '').toLowerCase().trim();
    if (l === 'python' || l === 'py') return 'python';
    if (l === 'javascript' || l === 'js') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    if (l === 'java') return 'java';
    if (l === 'c++' || l === 'cpp' || l === 'cplusplus') return 'cpp';
    if (l === 'c#' || l === 'csharp' || l === 'cs') return 'csharp';
    if (l === 'c') return 'c';
    if (l === 'sql' || l.includes('sql')) return 'sql';
    if (l === 'go' || l === 'golang') return 'go';
    if (l === 'rust' || l === 'rs') return 'rust';
    if (l === 'php') return 'php';
    if (l === 'ruby' || l === 'rb') return 'ruby';
    if (l === 'kotlin' || l === 'kt') return 'kotlin';
    if (l === 'swift') return 'swift';
    if (l.includes('sql')) return 'sql';
    if (l.includes('javascript') || l.includes('typescript')) return 'javascript';
    if (l.includes('java')) return 'java';
    if (l.includes('c++') || l.includes('cpp')) return 'cpp';
    if (l.includes('c#') || l.includes('csharp')) return 'csharp';
    return 'python';
}

function fileExtensionFor(lang) {
    const l = (lang || '').toLowerCase().trim();
    if (l === 'python' || l === 'py') return 'py';
    if (l === 'javascript' || l === 'js') return 'js';
    if (l === 'typescript' || l === 'ts') return 'ts';
    if (l === 'java') return 'java';
    if (l === 'c++' || l === 'cpp' || l === 'cplusplus') return 'cpp';
    if (l === 'c#' || l === 'csharp' || l === 'cs') return 'cs';
    if (l === 'c') return 'c';
    if (l === 'sql' || l.includes('sql')) return 'sql';
    if (l === 'go' || l === 'golang') return 'go';
    if (l === 'rust' || l === 'rs') return 'rs';
    if (l === 'php') return 'php';
    if (l === 'ruby' || l === 'rb') return 'rb';
    if (l === 'kotlin' || l === 'kt') return 'kt';
    if (l === 'swift') return 'swift';
    if (l.includes('sql')) return 'sql';
    if (l.includes('javascript')) return 'js';
    if (l.includes('typescript')) return 'ts';
    if (l.includes('java')) return 'java';
    if (l.includes('c++') || l.includes('cpp')) return 'cpp';
    if (l.includes('c#') || l.includes('csharp')) return 'cs';
    return 'py';
}

function filenameFor(lang) {
    const l = (lang || '').toLowerCase().trim();
    if (l === 'java') return 'Solution.java';
    if (l === 'c#' || l === 'csharp' || l === 'cs') return 'Solution.cs';
    if (l === 'kotlin' || l === 'kt') return 'Solution.kt';
    return `solution.${fileExtensionFor(lang)}`;
}

function getStarterCodeForLanguage(lang, q) {
    const l = (lang || '').toLowerCase().trim();
    const title = q ? (q.title || 'Solution') : 'Solution';
    if (q && (q.language || '').toLowerCase().trim() === l && q.starter_code) {
        return q.starter_code;
    }
    if (l === 'python' || l === 'py') {
        return `# ${title}\n\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n`;
    }
    if (l === 'javascript' || l === 'js') {
        return `// ${title}\n\nfunction solve() {\n    // Write your solution here\n}\n\nsolve();\n`;
    }
    if (l === 'typescript' || l === 'ts') {
        return `// ${title}\n\nfunction solve(): void {\n    // Write your solution here\n}\n\nsolve();\n`;
    }
    if (l === 'java') {
        return `// ${title}\nimport java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`;
    }
    if (l === 'c++' || l === 'cpp') {
        return `// ${title}\n#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`;
    }
    if (l === 'c#' || l === 'csharp' || l === 'cs') {
        return `// ${title}\nusing System;\nusing System.Collections.Generic;\n\npublic class Solution {\n    public static void Main(string[] args) {\n        // Write your solution here\n    }\n}\n`;
    }
    if (l === 'c') {
        return `// ${title}\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`;
    }
    if (l === 'sql' || l.includes('sql')) {
        return `-- ${title}\n-- Write your SQL query below\nSELECT * FROM table_name;\n`;
    }
    if (l === 'go' || l === 'golang') {
        return `// ${title}\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println("Hello, World!")\n}\n`;
    }
    if (l === 'rust' || l === 'rs') {
        return `// ${title}\nfn main() {\n    // Write your solution here\n}\n`;
    }
    if (l === 'php') {
        return `<?php\n// ${title}\n\nfunction solve() {\n    // Write your solution here\n}\n\nsolve();\n`;
    }
    if (l === 'ruby' || l === 'rb') {
        return `# ${title}\n\ndef solve\n  # Write your solution here\nend\n\nsolve\n`;
    }
    if (l === 'kotlin' || l === 'kt') {
        return `// ${title}\n\nfun main() {\n    // Write your solution here\n}\n`;
    }
    if (l === 'swift') {
        return `// ${title}\nimport Foundation\n\nfunc solve() {\n    // Write your solution here\n}\n\nsolve()\n`;
    }
    return `# Write your solution here\n`;
}

function onCodingLanguageChange(newLang) {
    const q = codingState.questions[codingState.currentIndex];
    if (!q || !monacoEditorInstance) return;
    const qId = String(q.id);

    if (!codingState.selectedLanguages) codingState.selectedLanguages = {};
    const oldLang = codingState.selectedLanguages[qId] || q.language || 'Python';

    codingState.selectedLanguages[qId] = newLang;
    q.language = newLang;

    // Update Monaco editor language
    monaco.editor.setModelLanguage(monacoEditorInstance.getModel(), monacoLanguageFor(newLang));

    // Update filename display
    const filenameEl = document.getElementById('coding-filename');
    if (filenameEl) filenameEl.textContent = filenameFor(newLang);

    // Check if current code in editor is empty or default starter of previous language
    const currentCode = monacoEditorInstance.getValue();
    const oldStarter = getStarterCodeForLanguage(oldLang, q);

    if (!currentCode.trim() || currentCode.trim() === oldStarter.trim() || !codingState.code[qId]) {
        const newStarter = getStarterCodeForLanguage(newLang, q);
        monacoEditorInstance.setValue(newStarter);
    }

    showToast(`Language switched to ${newLang}`);
}

// ── Interactive Code Runner & Compiler Console ──────────────────────────
let isCodeRunning = false;

function switchConsoleTab(tab) {
    const tabOutput = document.getElementById('cr-tab-output');
    const tabStdin = document.getElementById('cr-tab-stdin');
    const panelOutput = document.getElementById('cr-panel-output');
    const panelStdin = document.getElementById('cr-panel-stdin');

    if (tab === 'output') {
        if (tabOutput) tabOutput.classList.add('active');
        if (tabStdin) tabStdin.classList.remove('active');
        if (panelOutput) panelOutput.style.display = '';
        if (panelStdin) panelStdin.style.display = 'none';
    } else {
        if (tabOutput) tabOutput.classList.remove('active');
        if (tabStdin) tabStdin.classList.add('active');
        if (panelOutput) panelOutput.style.display = 'none';
        if (panelStdin) panelStdin.style.display = '';
    }
}

function clearConsole() {
    const terminal = document.getElementById('coding-output-terminal');
    if (terminal) {
        terminal.textContent = 'Click "Run" to compile and execute your code.';
        terminal.className = 'cr-console-terminal';
    }
    const compare = document.getElementById('coding-test-compare');
    if (compare) compare.style.display = 'none';
    const status = document.getElementById('coding-run-status');
    if (status) {
        status.textContent = 'Ready';
        status.className = 'cr-status-badge cr-status-idle';
    }
    const runTime = document.getElementById('coding-run-time');
    if (runTime) runTime.textContent = '';
}

function toggleConsoleSize() {
    const consoleEl = document.getElementById('coding-console');
    const icon = document.getElementById('icon-console-toggle');
    if (!consoleEl) return;

    if (consoleEl.classList.contains('expanded')) {
        consoleEl.classList.remove('expanded');
        consoleEl.classList.add('collapsed');
        if (icon) icon.innerHTML = '<path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>';
    } else if (consoleEl.classList.contains('collapsed')) {
        consoleEl.classList.remove('collapsed');
        if (icon) icon.innerHTML = '<path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>';
    } else {
        consoleEl.classList.add('expanded');
        if (icon) icon.innerHTML = '<path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>';
    }
    if (monacoEditorInstance) monacoEditorInstance.layout();
}

async function runCurrentCode() {
    if (isCodeRunning || !monacoEditorInstance) return;

    saveCurrentCodingAnswer();
    const code = monacoEditorInstance.getValue();
    if (!code || !code.trim()) {
        showToast('Please write some code before clicking Run.');
        return;
    }

    const q = codingState.questions[codingState.currentIndex];
    const qId = q ? String(q.id) : '';
    const curLang = (codingState.selectedLanguages && codingState.selectedLanguages[qId]) || (q ? q.language : 'Python') || 'Python';

    const consoleEl = document.getElementById('coding-console');
    if (consoleEl && consoleEl.classList.contains('collapsed')) {
        consoleEl.classList.remove('collapsed');
    }
    switchConsoleTab('output');

    const btnRun = document.getElementById('btn-coding-run');
    const statusEl = document.getElementById('coding-run-status');
    const timeEl = document.getElementById('coding-run-time');
    const terminalEl = document.getElementById('coding-output-terminal');
    const compareEl = document.getElementById('coding-test-compare');
    const expectedEl = document.getElementById('coding-expected-output');
    const actualEl = document.getElementById('coding-actual-output');
    const stdinEl = document.getElementById('coding-stdin-input');

    const customStdin = stdinEl ? stdinEl.value.trim() : '';
    const stdinToSend = customStdin || (q ? (q.example_input || '') : '');

    isCodeRunning = true;
    if (btnRun) {
        btnRun.disabled = true;
        btnRun.classList.add('running');
        const span = btnRun.querySelector('span');
        if (span) span.textContent = 'Running…';
    }
    if (statusEl) {
        statusEl.textContent = 'Running';
        statusEl.className = 'cr-status-badge cr-status-running';
    }
    if (timeEl) timeEl.textContent = '';
    if (terminalEl) {
        terminalEl.textContent = 'Compiling and executing code...';
        terminalEl.className = 'cr-console-terminal';
    }
    if (compareEl) compareEl.style.display = 'none';

    try {
        const res = await fetch('/api/coding/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                language: curLang,
                stdin: stdinToSend,
                question_id: qId,
                groq_api_key: state.groqKey || null
            })
        });

        const data = await res.json();

        if (timeEl && data.execution_time_ms !== undefined) {
            timeEl.textContent = `${data.execution_time_ms} ms`;
        }

        const isSuccess = data.status === 'success' && (!data.exit_code || data.exit_code === 0);
        const isTimeout = data.status === 'timeout';

        if (statusEl) {
            if (isTimeout) {
                statusEl.textContent = 'Time Limit';
                statusEl.className = 'cr-status-badge cr-status-timeout';
            } else if (isSuccess) {
                statusEl.textContent = 'Success';
                statusEl.className = 'cr-status-badge cr-status-success';
            } else {
                statusEl.textContent = 'Error';
                statusEl.className = 'cr-status-badge cr-status-error';
            }
        }

        let outputText = '';
        if (data.stdout && data.stdout.trim()) {
            outputText += data.stdout;
        }
        if (data.stderr && data.stderr.trim()) {
            if (outputText) outputText += '\n--- Errors / Traceback ---\n';
            outputText += data.stderr;
        }
        if (!outputText.trim()) {
            outputText = isSuccess
                ? '(Program completed successfully with no output)'
                : (data.stderr || 'Execution failed with non-zero exit code.');
        }

        if (terminalEl) {
            terminalEl.textContent = outputText;
            terminalEl.className = 'cr-console-terminal' + (isSuccess ? ' success-text' : ' error-text');
        }

        if (q && q.example_output && !customStdin && compareEl && expectedEl && actualEl) {
            expectedEl.textContent = q.example_output.trim();
            const actualClean = (data.stdout || '').trim();
            actualEl.textContent = actualClean || '—';
            compareEl.style.display = 'grid';
        }

    } catch (err) {
        console.error('Run code error:', err);
        if (statusEl) {
            statusEl.textContent = 'Error';
            statusEl.className = 'cr-status-badge cr-status-error';
        }
        if (terminalEl) {
            terminalEl.textContent = `Execution Error: ${err.message || err}`;
            terminalEl.className = 'cr-console-terminal error-text';
        }
    } finally {
        isCodeRunning = false;
        if (btnRun) {
            btnRun.disabled = false;
            btnRun.classList.remove('running');
            const span = btnRun.querySelector('span');
            if (span) span.textContent = 'Run';
        }
    }
}

async function initCodingEditor() {
    await ensureMonacoLoaded();
    const container = document.getElementById('coding-editor');
    if (!container) return null;
    if (!monacoEditorInstance) {
        monacoEditorInstance = monaco.editor.create(container, {
            value: '',
            language: 'python',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 4,
            scrollBeyondLastLine: false,
            wordWrap: 'on'
        });

        // Add Ctrl+Enter or Cmd+Enter keybinding to trigger Run
        monacoEditorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            runCurrentCode();
        });
    }
    return monacoEditorInstance;
}

function renderCodingPanels() {
    const intro = document.getElementById('coding-intro');
    const live = document.getElementById('coding-live');
    const results = document.getElementById('coding-results');
    if (intro) intro.style.display = codingState.phase === 'intro' ? '' : 'none';
    if (live) live.style.display = codingState.phase === 'live' ? '' : 'none';
    if (results) results.style.display = codingState.phase === 'results' ? '' : 'none';

    if (codingState.phase === 'live') {
        setTimeout(() => {
            if (typeof initProctorCamDrag === 'function') initProctorCamDrag();
            if (typeof window.repositionCodingProctorCam === 'function') window.repositionCodingProctorCam(false);
        }, 50);
    }

    const infoTime = document.getElementById('coding-info-time');
    if (infoTime) infoTime.textContent = fmtClock(CODING_DURATION_SECONDS);
}

// The role the candidate has chosen in the intro screen (select value, or the
// free-text box when "Other…" is picked).
function selectedRole() {
    const sel = document.getElementById('cr-role-select');
    const val = sel ? sel.value : '';
    if (val === '__other__') {
        return (document.getElementById('cr-role-other')?.value || '').trim();
    }
    return (val || '').trim();
}

function readSetupForm() {
    state.candidateName = (document.getElementById('cr-cand-name')?.value || '').trim() || 'Candidate';
    state.jobTitle = selectedRole() || (document.getElementById('cr-target-role')?.value || '').trim();
    state.resumeText = (document.getElementById('cr-resume-text')?.value || '').trim();
    state.jdText = (document.getElementById('cr-jd-text')?.value || '').trim();
    state.groqKey = (document.getElementById('cr-groq-key')?.value || '').trim();
}

async function startCodingRound() {
    readSetupForm();

    const btn = document.getElementById('btn-start-coding');
    if (btn) { btn.disabled = true; btn.textContent = 'Generating coding questions…'; }
    showToast('Generating your resume-based coding round…');

    try {
        const res = await fetch('/api/coding/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resume_text: state.resumeText || '',
                jd_text: state.jdText || '',
                target_role: state.jobTitle || null,
                candidate_name: resolveCandidateName(),
                groq_api_key: state.groqKey || null
            })
        });
        const data = await res.json();
        if (!res.ok || !data.questions || data.questions.length === 0) {
            throw new Error(data.detail || 'No coding questions returned');
        }

        codingState.questions = data.questions;
        codingState.code = {};
        codingState.selectedLanguages = {};
        codingState.warnings = 0;
        codingState.currentIndex = 0;
        codingState.remainingSeconds = CODING_DURATION_SECONDS;
        codingState.result = null;

        showCodingInstructions();
    } catch (e) {
        console.error('Coding round start error:', e);
        showToast('Could not start the coding round. Please try again.');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="icon-lg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg> Start Coding Round'; }
    }
}

function showCodingInstructions() {
    const o = document.getElementById('coding-instructions-overlay');
    if (o) {
        o.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }
}

function cancelCodingStart() {
    const o = document.getElementById('coding-instructions-overlay');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (codingState.phase !== 'live') {
        codingState.questions = [];
        renderCodingPanels();
    }
}

async function confirmCodingStart() {
    const o = document.getElementById('coding-instructions-overlay');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (!codingState.questions || !codingState.questions.length) return;

    codingState.startedAt = Date.now();
    codingState.phase = 'live';

    const candEl = document.getElementById('coding-cand-name');
    if (candEl) candEl.textContent = resolveCandidateName();

    renderCodingPanels();
    if (typeof initProctorCamDrag === 'function') initProctorCamDrag();
    if (typeof window.repositionCodingProctorCam === 'function') window.repositionCodingProctorCam(true);

    await initCodingEditor();
    renderCodingQuestion();
    renderCodingPalette();
    updateCodingWarnBadge();
    startCodingTimer();
    await startCodingProctoring();
    showToast(`Coding round started — ${codingState.questions.length} problems. Good luck!`);
}

function renderCodingQuestion() {
    const q = codingState.questions[codingState.currentIndex];
    if (!q) return;
    const total = codingState.questions.length;
    const idx = codingState.currentIndex;
    const qId = String(q.id);

    if (!codingState.selectedLanguages) codingState.selectedLanguages = {};
    const curLang = codingState.selectedLanguages[qId] || q.language || 'Python';
    q.language = curLang;

    const langSelect = document.getElementById('coding-lang-select');
    if (langSelect) {
        let matched = false;
        for (let i = 0; i < langSelect.options.length; i++) {
            if (langSelect.options[i].value.toLowerCase() === curLang.toLowerCase()) {
                langSelect.selectedIndex = i;
                matched = true;
                break;
            }
        }
        if (!matched) {
            const opt = document.createElement('option');
            opt.value = curLang;
            opt.textContent = curLang;
            langSelect.appendChild(opt);
            langSelect.value = curLang;
        }
    }

    const filenameEl = document.getElementById('coding-filename');
    if (filenameEl) filenameEl.textContent = filenameFor(curLang);

    const diffEl = document.getElementById('coding-difficulty-tag');
    diffEl.textContent = q.difficulty || 'Moderate';
    diffEl.classList.remove('cr-diff-easy', 'cr-diff-hard');
    if ((q.difficulty || '').toLowerCase() === 'easy') diffEl.classList.add('cr-diff-easy');
    if ((q.difficulty || '').toLowerCase() === 'hard') diffEl.classList.add('cr-diff-hard');

    document.getElementById('coding-q-title-full').textContent = `${idx + 1}. ${q.title || `Question ${idx + 1}`}`;
    const easyCount = codingState.questions.filter(x => x.difficulty === 'Easy').length;
    const modCount = codingState.questions.filter(x => x.difficulty === 'Moderate').length;
    const hardCount = codingState.questions.filter(x => x.difficulty === 'Hard').length;
    document.getElementById('coding-progress-tag').textContent = `${total} problems · ${easyCount} easy · ${modCount} moderate · ${hardCount} hard`;

    const tagsRow = document.getElementById('coding-tags-row');
    tagsRow.innerHTML = '';
    (q.tags || []).forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'cr-tag-pill';
        pill.textContent = tag;
        tagsRow.appendChild(pill);
    });

    document.getElementById('coding-question-text').textContent = q.problem_statement || q.prompt || '';

    const inputBlock = document.getElementById('coding-input-block');
    if (q.input_format) {
        inputBlock.style.display = '';
        document.getElementById('coding-input-format').textContent = q.input_format;
    } else {
        inputBlock.style.display = 'none';
    }

    const outputBlock = document.getElementById('coding-output-block');
    if (q.output_format) {
        outputBlock.style.display = '';
        document.getElementById('coding-output-format').textContent = q.output_format;
    } else {
        outputBlock.style.display = 'none';
    }

    const exampleBlock = document.getElementById('coding-example-block');
    if (q.example_input || q.example_output) {
        exampleBlock.style.display = '';
        document.getElementById('coding-example-input').textContent = q.example_input || '—';
        document.getElementById('coding-example-output').textContent = q.example_output || '—';
    } else {
        exampleBlock.style.display = 'none';
    }

    const evalList = document.getElementById('coding-eval-points-list');
    evalList.innerHTML = '';
    (q.eval_points || []).forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        evalList.appendChild(li);
    });

    if (monacoEditorInstance) {
        const value = (qId in codingState.code) ? codingState.code[qId] : getStarterCodeForLanguage(curLang, q);
        monacoEditorInstance.setValue(value);
        monaco.editor.setModelLanguage(monacoEditorInstance.getModel(), monacoLanguageFor(curLang));
    }

    const prevBtn = document.getElementById('btn-coding-prev');
    if (prevBtn) {
        prevBtn.disabled = (idx === 0);
        prevBtn.style.opacity = (idx === 0) ? '0.45' : '1';
        prevBtn.style.cursor = (idx === 0) ? 'not-allowed' : 'pointer';
    }
    const saveNextBtn = document.getElementById('btn-coding-save');
    if (saveNextBtn) {
        saveNextBtn.textContent = (idx === total - 1) ? 'Save Answer' : 'Save & Next';
    }

    document.getElementById('coding-q-menu').style.display = 'none';
    renderCodingPalette();
    renderCodingProgress();
    clearConsole();
}

function saveCurrentCodingAnswer() {
    const q = codingState.questions[codingState.currentIndex];
    if (!q || !monacoEditorInstance) return;
    const qId = String(q.id);
    const curLang = (codingState.selectedLanguages && codingState.selectedLanguages[qId]) || q.language || 'Python';
    const starter = getStarterCodeForLanguage(curLang, q);
    const value = monacoEditorInstance.getValue();
    if (value.trim() === starter.trim()) {
        delete codingState.code[qId];
    } else {
        codingState.code[qId] = value;
    }
}

function resetCodingStarter() {
    const q = codingState.questions[codingState.currentIndex];
    if (!q || !monacoEditorInstance) return;
    const qId = String(q.id);
    const curLang = (codingState.selectedLanguages && codingState.selectedLanguages[qId]) || q.language || 'Python';
    if (!confirm(`Reset this question back to the ${curLang} starter template? Your current edits for this question will be lost.`)) return;
    const starter = getStarterCodeForLanguage(curLang, q);
    monacoEditorInstance.setValue(starter);
    delete codingState.code[qId];
    renderCodingPalette();
    renderCodingProgress();
}

function codingGoto(i) {
    if (i < 0 || i >= codingState.questions.length) return;
    saveCurrentCodingAnswer();
    codingState.currentIndex = i;
    renderCodingQuestion();
}

function codingPrev() {
    saveCurrentCodingAnswer();
    if (codingState.currentIndex > 0) {
        codingState.currentIndex--;
        renderCodingQuestion();
    }
}

function codingSaveNext() {
    saveCurrentCodingAnswer();
    const total = codingState.questions.length;
    if (codingState.currentIndex < total - 1) {
        codingState.currentIndex++;
        renderCodingQuestion();
    } else {
        renderCodingProgress();
        renderCodingPalette();
        showToast('Code saved for Question ' + (codingState.currentIndex + 1) + '. You can use "Previous" or the question tabs above to review and modify your code before submitting.');
    }
}

function renderCodingPalette() {
    const palette = document.getElementById('coding-q-palette');
    if (!palette) return;
    palette.innerHTML = '';
    codingState.questions.forEach((q, i) => {
        const qId = String(q.id);
        const written = !!(codingState.code[qId] && codingState.code[qId].trim().length > 0);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cr-palette-btn' + (i === codingState.currentIndex ? ' active' : '') + (written ? ' answered' : '');
        btn.innerHTML = `<span>Q${i + 1}</span>${written ? '<span class="cr-palette-check">✓</span>' : ''}`;
        btn.title = `Question ${i + 1}: ${q.title || ''} (${q.difficulty || ''}) - ${written ? 'Answered' : 'Not answered'}`;
        btn.addEventListener('click', () => codingGoto(i));
        palette.appendChild(btn);
    });
}

function toggleCodingQuestionMenu() {
    const menu = document.getElementById('coding-q-menu');
    if (!menu) return;
    if (menu.style.display === 'none' || !menu.style.display) {
        renderCodingQuestionMenu();
        menu.style.display = '';
    } else {
        menu.style.display = 'none';
    }
}

function renderCodingQuestionMenu() {
    const menu = document.getElementById('coding-q-menu');
    if (!menu) return;
    menu.innerHTML = '';
    codingState.questions.forEach((q, i) => {
        const qId = String(q.id);
        const written = !!(codingState.code[qId] && codingState.code[qId].trim().length > 0);
        const item = document.createElement('div');
        item.className = 'cr-q-menu-item' + (i === codingState.currentIndex ? ' cr-q-menu-current' : '');
        item.innerHTML = `<span>${i + 1}. ${q.title || 'Question ' + (i + 1)} &middot; ${q.difficulty || ''}</span>`;
        const dot = document.createElement('span');
        dot.className = 'cr-q-menu-written' + (written ? ' written' : '');
        item.appendChild(dot);
        item.addEventListener('click', () => codingGoto(i));
        menu.appendChild(item);
    });
}

function renderCodingProgress() {
    const total = codingState.questions.length;
    const written = Object.values(codingState.code).filter(c => c && c.trim().length > 0).length;
    const el = document.getElementById('coding-solved-count');
    if (el) el.textContent = `${written} of ${total} written`;
}

function startCodingTimer() {
    stopCodingTimer();
    const timerEl = document.getElementById('coding-timer');
    const tick = () => {
        codingState.remainingSeconds--;
        if (timerEl) {
            timerEl.textContent = fmtClock(codingState.remainingSeconds);
            timerEl.classList.toggle('assessment-timer--low', codingState.remainingSeconds <= 300);
        }
        if (codingState.remainingSeconds <= 0) {
            stopCodingTimer();
            showToast('Time is up — submitting your coding round.');
            submitCodingRound(true);
        }
    };
    if (timerEl) timerEl.textContent = fmtClock(codingState.remainingSeconds);
    codingState.timerInterval = setInterval(tick, 1000);
}

function stopCodingTimer() {
    if (codingState.timerInterval) {
        clearInterval(codingState.timerInterval);
        codingState.timerInterval = null;
    }
}

async function submitCodingRound(auto = false) {
    if (codingState.phase !== 'live') return;
    saveCurrentCodingAnswer();

    if (!auto) {
        if (!confirm('Submit your coding round for AI review now?')) return;
    }

    stopCodingTimer();
    stopCodingProctoring();
    const timeTaken = codingState.startedAt
        ? Math.round((Date.now() - codingState.startedAt) / 1000)
        : (CODING_DURATION_SECONDS - codingState.remainingSeconds);

    showToast('Reviewing your submitted code…');

    try {
        const res = await fetch('/api/coding/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questions: codingState.questions,
                submissions: codingState.code,
                time_taken_seconds: timeTaken,
                groq_api_key: state.groqKey || null
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Evaluation failed');
        codingState.result = data;
    } catch (e) {
        console.error('Coding round submit error:', e);
        showToast('Could not score the coding round. Please try again.');
        codingState.phase = 'live';
        startCodingTimer();
        startCodingProctoring();
        return;
    }

    // Rendering happens outside the network try/catch so a DOM/render issue
    // can never be mistaken for a failed submission and revert the phase
    // (which previously left codingState.phase stuck on 'live' behind a
    // results screen that was already showing, wrongly arming the
    // beforeunload "Leave site?" warning on the next-round link).
    codingState.phase = 'results';
    renderCodingPanels();
    renderCodingCompletion();
}

function renderCodingCompletion() {
    const nameEl = document.getElementById('coding-result-name');
    if (nameEl) nameEl.textContent = resolveCandidateName();
}

function restartCodingRound() {
    stopCodingTimer();
    stopCodingProctoring();
    codingState.questions = [];
    codingState.code = {};
    codingState.warnings = 0;
    codingState.currentIndex = 0;
    codingState.remainingSeconds = CODING_DURATION_SECONDS;
    codingState.result = null;
    codingState.phase = 'intro';
    updateCodingWarnBadge();
    renderCodingPanels();
}

// Warn candidate if they navigate away mid-coding-round
window.addEventListener('beforeunload', (e) => {
    if (codingState.phase === 'live') {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ── Session hydration (integrated JobJugad workflow) ─────────────────────
// The candidate, resume and JD are captured earlier in the linear workflow
// (Dashboard → Setup → Aptitude → Coding). Pull them from the session so the
// coding round needs no manual re-entry; the candidate only picks/confirms the
// TARGET ROLE, which drives the language plan (Data Analyst → SQL + Python, …).
let planDebounce = null;

async function hydrateCodingFromSession() {
    try {
        const res = await fetch('/api/coding/context');
        if (!res.ok) return;
        const ctx = await res.json();

        // hidden fields the server also falls back to
        if (ctx.candidate_name && ctx.candidate_name !== 'Candidate') {
            state.candidateName = ctx.candidate_name;
            const el = document.getElementById('cr-cand-name');
            if (el) el.value = ctx.candidate_name;
        }
        if (ctx.resume_text) {
            state.resumeText = ctx.resume_text;
            const resEl = document.getElementById('cr-resume-text');
            if (resEl) resEl.value = ctx.resume_text;
        }
        if (ctx.jd_text) {
            state.jdText = ctx.jd_text;
            const jdEl = document.getElementById('cr-jd-text');
            if (jdEl) jdEl.value = ctx.jd_text;
        }

        const detected = (ctx.detected_role || '').trim();
        const options = (ctx.role_options || []).slice();
        // Make sure the detected role is a pickable option.
        if (detected && !options.some(o => o.toLowerCase() === detected.toLowerCase())) {
            options.unshift(detected);
        }

        const sel = document.getElementById('cr-role-select');
        if (sel) {
            sel.innerHTML =
                options.map(o => `<option value="${o.replace(/"/g, '&quot;')}">${o}</option>`).join('') +
                '<option value="__other__">Other… (type your role)</option>';
            if (detected) sel.value = options.find(o => o.toLowerCase() === detected.toLowerCase()) || detected;
        }

        // skills chips under the callout
        if ((ctx.skills || []).length) {
            const wrap = document.createElement('div');
            wrap.className = 'cr-skill-pills';
            wrap.innerHTML =
                '<span class="cr-hint">Skills on file: </span>' +
                ctx.skills.map(k => `<span class="cr-tag-pill">${k}</span>`).join('');
            const callout = document.getElementById('cr-plan-callout');
            if (callout) callout.parentNode.insertBefore(wrap, callout.nextSibling);
        }

        if (!ctx.has_resume) {
            const callout = document.getElementById('cr-plan-callout');
            if (callout) {
                callout.innerHTML =
                    '<strong>No resume found for this run.</strong> Questions fall back to a ' +
                    'general set for the role you pick. Go back to ' +
                    '<a href="/setup">Resume &amp; JD Setup</a> to parse your resume for tailored questions.';
            }
        }

        onRoleChange();
    } catch (e) {
        console.warn('Could not hydrate coding round from session:', e);
    }
}

function onRoleChange() {
    const sel = document.getElementById('cr-role-select');
    const otherField = document.getElementById('cr-role-other-field');
    if (otherField) otherField.hidden = !(sel && sel.value === '__other__');

    if (planDebounce) clearTimeout(planDebounce);
    planDebounce = setTimeout(refreshPlan, 250);
}

async function refreshPlan() {
    const callout = document.getElementById('cr-plan-callout');
    const role = selectedRole();
    if (!callout) return;
    if (!role) { callout.innerHTML = '<span class="cr-hint">Pick a target role to see what the round will test.</span>'; return; }

    try {
        const res = await fetch('/api/coding/context?role=' + encodeURIComponent(role));
        if (!res.ok) return;
        const ctx = await res.json();
        const p = ctx.plan || {};
        const langs = p.languages || [];
        // count consecutive languages for a "3 SQL + 2 Python" style pill row
        const counts = {};
        langs.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
        const pills = Object.entries(counts)
            .map(([l, n]) => `<span class="cr-plan-pill">${n} × ${l}</span>`).join(' ');

        callout.innerHTML =
            '<div>This round will test: <span class="cr-plan-langs">' + (p.summary || langs.join(', ')) + '</span></div>' +
            '<div style="margin-top:6px;">' + pills + '</div>' +
            (p.reason ? '<div class="cr-hint" style="margin-top:6px;">' + p.reason + '</div>' : '') +
            (p.is_mixed
                ? '<div class="cr-hint" style="margin-top:4px;">Questions 1–' +
                  langs.filter(l => l === langs[0]).length + ' are ' + langs[0] +
                  ', the rest are ' + (langs.find(l => l !== langs[0]) || '') + '.</div>'
                : '');
    } catch (e) {
        console.warn('plan preview failed:', e);
    }
}

// ── Boot ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderCodingPanels();
    hydrateCodingFromSession();
    initProctorCamDrag();
    initProctoring();
});
