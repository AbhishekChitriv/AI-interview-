/**
 * Resume & JD Dashboard & Live AI HR Interviewer Application Logic
 * Powered by Eliora AI Engine (Groq / Gemini / Claude)
 */

document.addEventListener("DOMContentLoaded", () => {

    // --- State Management ---
    const state = {
        resumeText: "",
        resumeFileName: "",
        jdText: "",
        jdFileName: "",
        provider: "groq",
        accent: "Indian",
        candidateName: "",
        jobTitle: "Senior Software Engineer",
        numQuestions: 10,
        
        // Interview Session State
        interviewSession: {
            questions: [],
            currentIndex: 0,
            answers: [],
            evaluations: [],
            timerInterval: null,
            secondsElapsed: 0,
            isSpeaking: false,
            isListening: false,
            recognition: null
        }
    };

    // --- DOM Element References ---
    const initialUploadView = document.getElementById("initialUploadView");
    const parsedProfileView = document.getElementById("parsedProfileView");

    const resumeDropzone = document.getElementById("resumeDropzone");
    const resumeFileInput = document.getElementById("resumeFileInput");
    const resumeUploadedStatus = document.getElementById("resumeUploadedStatus");
    const resumeFileName = document.getElementById("resumeFileName");
    const removeResumeBtn = document.getElementById("removeResumeBtn");
    const resumeTextarea = document.getElementById("resumeTextarea");
    const browseResumeBtn = document.getElementById("browseResumeBtn");
    const parsePastedBtn = document.getElementById("parsePastedBtn");

    const jdDropzone = document.getElementById("jdDropzone");
    const jdFileInput = document.getElementById("jdFileInput");
    const jdUploadedStatus = document.getElementById("jdUploadedStatus");
    const jdFileName = document.getElementById("jdFileName");
    const removeJdBtn = document.getElementById("removeJdBtn");
    const jdTextarea = document.getElementById("jdTextarea");
    const browseJdBtn = document.getElementById("browseJdBtn");

    const launchInterviewBtn = document.getElementById("launchInterviewBtn");

    const candidateNameInput = document.getElementById("candidateNameInput");
    const jobTitleInput = document.getElementById("jobTitleInput");
    const numQuestionsSelect = document.getElementById("numQuestionsSelect");
    const aiProviderSelect = document.getElementById("aiProviderSelect");
    const targetJobTitleSelect = document.getElementById("targetJobTitleSelect");

    const accentIndianLabel = document.getElementById("accentIndianLabel");
    const accentForeignLabel = document.getElementById("accentForeignLabel");

    // Elements for Big Screen / Parsed Profile
    const bsCandidateName = document.getElementById("bsCandidateName");
    const bsCandidateRole = document.getElementById("bsCandidateRole");
    const bsSummaryText = document.getElementById("bsSummaryText");
    const bsSkillTags = document.getElementById("bsSkillTags");
    const changeResumeBtn = document.getElementById("changeResumeBtn");

    // Modals
    const alignmentModal = document.getElementById("alignmentModal");
    const closeAlignmentModalBtn = document.getElementById("closeAlignmentModalBtn");
    const alignmentModalBody = document.getElementById("alignmentModalBody");

    const interviewModal = document.getElementById("interviewModal");
    const exitInterviewBtn = document.getElementById("exitInterviewBtn");

    // Interview Arena Elements
    const interviewLoadingState = document.getElementById("interviewLoadingState");
    const interviewArena = document.getElementById("interviewArena");
    const finalAssessmentContainer = document.getElementById("finalAssessmentContainer");

    const currentAccentDisplay = document.getElementById("currentAccentDisplay");
    const timerDisplay = document.getElementById("timerDisplay");
    const qCurrentIndex = document.getElementById("qCurrentIndex");
    const qTotalCount = document.getElementById("qTotalCount");

    const qCategoryPill = document.getElementById("qCategoryPill");
    const questionText = document.getElementById("questionText");
    const evalPointsList = document.getElementById("evalPointsList");
    const speakQuestionBtn = document.getElementById("speakQuestionBtn");

    const candidateAnswerTextarea = document.getElementById("candidateAnswerTextarea");
    const micToggleBtn = document.getElementById("micToggleBtn");
    const micBtnText = document.getElementById("micBtnText");
    const submitAnswerBtn = document.getElementById("submitAnswerBtn");

    const feedbackResultCard = document.getElementById("feedbackResultCard");
    const feedbackScoreBadge = document.getElementById("feedbackScoreBadge");
    const feedbackPositive = document.getElementById("feedbackPositive");
    const feedbackImprovement = document.getElementById("feedbackImprovement");
    const nextQuestionBtn = document.getElementById("nextQuestionBtn");

    const restartInterviewBtn = document.getElementById("restartInterviewBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    const assessmentSummaryGrid = document.getElementById("assessmentSummaryGrid");

    // Theme Toggle
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    // --- Helper Functions ---
    function showToast(message, type = "info") {
        const container = document.getElementById("toastContainer");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        const iconMap = {
            success: "fa-circle-check",
            error: "fa-circle-exclamation",
            info: "fa-circle-info"
        };
        toast.innerHTML = `<i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Provider Selector Sync
    if (aiProviderSelect) {
        aiProviderSelect.addEventListener("change", (e) => {
            state.provider = e.target.value;
            showToast(`AI Engine switched to ${e.target.options[e.target.selectedIndex].text}`, "info");
        });
    }

    // Theme Toggle
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const currentTheme = document.body.getAttribute("data-theme");
            if (currentTheme === "dark") {
                document.body.removeAttribute("data-theme");
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            } else {
                document.body.setAttribute("data-theme", "dark");
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
        });
    }

    // Synchronize Target Job Title Select with bottom input
    if (targetJobTitleSelect) {
        targetJobTitleSelect.addEventListener("change", (e) => {
            const selectedTitle = e.target.value;
            if (jobTitleInput) {
                jobTitleInput.value = selectedTitle;
            }
            state.jobTitle = selectedTitle;
        });
    }

    if (candidateNameInput) {
        candidateNameInput.addEventListener("input", (e) => {
            state.candidateName = e.target.value;
            if (bsCandidateName) bsCandidateName.textContent = e.target.value || "Candidate";
        });
    }

    if (jobTitleInput) {
        jobTitleInput.addEventListener("input", (e) => {
            state.jobTitle = e.target.value;
        });
    }

    // --- VIEW SWITCHING FUNCTIONS ---
    function showParsedProfileView(name, role, summary, skills, recommendedRoles) {
        const displayName = name && name !== "Pratik Kale" ? name : "Candidate";
        if (bsCandidateName) bsCandidateName.textContent = displayName;
        if (bsCandidateRole) bsCandidateRole.textContent = role || "Candidate Profile";
        if (bsSummaryText) bsSummaryText.textContent = summary || "Extracted candidate profile overview.";

        if (bsSkillTags && skills && skills.length > 0) {
            bsSkillTags.innerHTML = skills.map(s => `<span class="skill-pill">${s}</span>`).join('');
        }

        if (candidateNameInput) candidateNameInput.value = name || "";
        state.candidateName = displayName;

        const primaryRole = (recommendedRoles && recommendedRoles[0]) ? recommendedRoles[0] : "Data Analyst";
        if (jobTitleInput) jobTitleInput.value = primaryRole;
        state.jobTitle = primaryRole;

        if (targetJobTitleSelect && recommendedRoles && recommendedRoles.length > 0) {
            targetJobTitleSelect.innerHTML = recommendedRoles.map((r, i) => 
                `<option value="${r}" ${i === 0 ? 'selected' : ''}>🎯 ${r}${i === 0 ? ' (Top AI Recommendation)' : ''}</option>`
            ).join('');
        }

        if (initialUploadView) initialUploadView.style.display = "none";
        if (parsedProfileView) parsedProfileView.style.display = "flex";
    }

    function showInitialUploadView() {
        if (initialUploadView) initialUploadView.style.display = "block";
        if (parsedProfileView) parsedProfileView.style.display = "none";
    }

    // Clicking "Upload a different resume" directly launches the file selection dialog!
    if (changeResumeBtn) {
        changeResumeBtn.addEventListener("click", () => {
            showInitialUploadView();
            if (resumeFileInput) {
                resumeFileInput.click();
            }
        });
    }

    // Direct Document Chooser Triggers
    if (browseResumeBtn) {
        browseResumeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (resumeFileInput) resumeFileInput.click();
        });
    }

    if (browseJdBtn) {
        browseJdBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (jdFileInput) jdFileInput.click();
        });
    }

    // Auto Parse Resume & Auto Fill Candidate Name + Job Title
    function autoParseResume(text) {
        if (!text || text.trim().length < 10) {
            loadDefaultSampleProfile();
            return;
        }
        showToast("Auto-analyzing candidate profile & extracting details...", "info");

        fetch("/api/extract-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume_text: text, provider: state.provider })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                const p = data.data;
                const recs = [
                    p.primary_role || "Data Analyst",
                    "Artificial Intelligence Engineer",
                    "Data Scientist",
                    "Machine Learning Engineer"
                ];

                showParsedProfileView(
                    p.candidate_name || "Candidate",
                    p.primary_role || "Candidate Profile",
                    p.summary || "Extracted candidate profile overview.",
                    p.top_skills || ["Python", "SQL", "Communication"],
                    recs
                );

                showToast(`Parsed profile for ${p.candidate_name || 'Candidate'}!`, "success");
            } else {
                loadDefaultSampleProfile();
            }
        })
        .catch(err => {
            console.error("Auto parse error:", err);
            loadDefaultSampleProfile();
        });
    }

    function loadDefaultSampleProfile() {
        showParsedProfileView(
            "Candidate",
            "Software Candidate",
            "Upload your resume to extract candidate details and generate interview questions.",
            ["Python", "SQL", "Problem Solving"],
            ["Software Engineer", "Data Analyst"]
        );
    }

    // --- Direct File Drag & Drop & Selection Setup ---
    function setupWorkableDropzone(dropzoneEl, fileInputEl, statusEl, fileNameEl, removeBtnEl, textareaEl, fileType) {
        dropzoneEl.addEventListener("click", (e) => {
            if (e.target !== removeBtnEl && !removeBtnEl.contains(e.target)) {
                fileInputEl.click();
            }
        });

        dropzoneEl.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzoneEl.classList.add("dragover");
        });

        dropzoneEl.addEventListener("dragleave", () => {
            dropzoneEl.classList.remove("dragover");
        });

        dropzoneEl.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzoneEl.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0], fileType, statusEl, fileNameEl, dropzoneEl, textareaEl);
            }
        });

        fileInputEl.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0], fileType, statusEl, fileNameEl, dropzoneEl, textareaEl);
            }
        });

        removeBtnEl.addEventListener("click", (e) => {
            e.stopPropagation();
            fileInputEl.value = "";
            statusEl.style.display = "none";
            dropzoneEl.querySelector(".dropzone-content").style.display = "block";
            if (textareaEl) textareaEl.value = "";
            showToast(`${fileType === 'resume' ? 'Resume' : 'Job Description'} cleared`, "info");
        });
    }

    function handleFileUpload(file, fileType, statusEl, fileNameEl, dropzoneEl, textareaEl) {
        const formData = new FormData();
        formData.append("file", file);

        if (fileNameEl) fileNameEl.textContent = file.name;
        if (dropzoneEl.querySelector(".dropzone-content")) {
            dropzoneEl.querySelector(".dropzone-content").style.display = "none";
        }
        if (statusEl) statusEl.style.display = "flex";

        showToast(`Extracting document text from ${file.name}...`, "info");

        fetch("/api/upload", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (textareaEl) textareaEl.value = data.text;
                if (fileType === "resume") {
                    state.resumeText = data.text;
                    state.resumeFileName = file.name;
                    // Directly Parse & Display Parsed Profile View!
                    autoParseResume(data.text);
                } else {
                    state.jdText = data.text;
                    state.jdFileName = file.name;
                    showToast(`Loaded Job Description ${file.name}!`, "success");
                }
            } else {
                showToast(`Failed to parse file: ${data.error}`, "error");
            }
        })
        .catch(err => {
            console.error(err);
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (textareaEl) textareaEl.value = evt.target.result;
                if (fileType === "resume") {
                    state.resumeText = evt.target.result;
                    autoParseResume(evt.target.result);
                } else {
                    state.jdText = evt.target.result;
                }
            };
            reader.readAsText(file);
        });
    }

    setupWorkableDropzone(resumeDropzone, resumeFileInput, resumeUploadedStatus, resumeFileName, removeResumeBtn, resumeTextarea, "resume");
    setupWorkableDropzone(jdDropzone, jdFileInput, jdUploadedStatus, jdFileName, removeJdBtn, jdTextarea, "jd");

    // Textarea Input Listeners & Parse Button for Pasted Text
    if (resumeTextarea) {
        resumeTextarea.addEventListener("input", (e) => {
            state.resumeText = e.target.value;
            if (parsePastedBtn) {
                parsePastedBtn.style.display = e.target.value.trim().length > 15 ? "flex" : "none";
            }
        });
    }

    if (parsePastedBtn) {
        parsePastedBtn.addEventListener("click", () => {
            if (resumeTextarea && resumeTextarea.value.trim().length > 10) {
                autoParseResume(resumeTextarea.value.trim());
            }
        });
    }

    // Textarea Input Listeners
    if (resumeTextarea) resumeTextarea.addEventListener("input", (e) => state.resumeText = e.target.value);
    if (jdTextarea) jdTextarea.addEventListener("input", (e) => state.jdText = e.target.value);

    // --- Accent Selector Handling ---
    if (accentIndianLabel) {
        accentIndianLabel.addEventListener("click", () => {
            accentIndianLabel.classList.add("active");
            if (accentForeignLabel) accentForeignLabel.classList.remove("active");
            state.accent = "Indian";
        });
    }

    if (accentForeignLabel) {
        accentForeignLabel.addEventListener("click", () => {
            accentForeignLabel.classList.add("active");
            if (accentIndianLabel) accentIndianLabel.classList.remove("active");
            state.accent = "Foreign";
        });
    }

    function renderResumeProfile(profile) {
        if (profile.candidate_name && candidateNameInput) candidateNameInput.value = profile.candidate_name;

        resumeProfileModalBody.innerHTML = `
            <div class="profile-section">
                <h4><i class="fa-solid fa-user"></i> ${profile.candidate_name || 'Candidate Profile'}</h4>
                <p><strong>Primary Role:</strong> ${profile.primary_role || 'Software Engineer'} • <strong>Experience:</strong> ${profile.total_experience || 'N/A'}</p>
                <p><strong>Email:</strong> ${profile.email || 'N/A'} • <strong>Phone:</strong> ${profile.phone || 'N/A'}</p>
            </div>
            <div class="profile-section">
                <h4><i class="fa-solid fa-align-left"></i> Professional Summary</h4>
                <p style="font-size:13px; color:var(--text-secondary);">${profile.summary || 'No summary available.'}</p>
            </div>
            <div class="profile-section">
                <h4><i class="fa-solid fa-code"></i> Top Extracted Skills</h4>
                <div class="skill-tags">
                    ${(profile.top_skills || []).map(skill => `<span class="tag-skill">${skill}</span>`).join('')}
                </div>
            </div>
            ${profile.education ? `
            <div class="profile-section">
                <h4><i class="fa-solid fa-graduation-cap"></i> Education</h4>
                <p style="font-size:13px;">${Array.isArray(profile.education) ? profile.education.join(', ') : profile.education}</p>
            </div>` : ''}
        `;
    }

    const closeResumeModalBtn = document.getElementById("closeResumeModalBtn");
    const resumeProfileModal = document.getElementById("resumeProfileModal");
    if (closeResumeModalBtn && resumeProfileModal) {
        closeResumeModalBtn.addEventListener("click", () => resumeProfileModal.classList.remove("active"));
    }

    // --- Step 2 Action: Analyze Alignment ---
    const analyzeAlignmentBtn = document.getElementById("analyzeAlignmentBtn");
    if (analyzeAlignmentBtn) analyzeAlignmentBtn.addEventListener("click", () => {
        const rText = resumeTextarea.value.trim();
        const jText = jdTextarea.value.trim();

        if (!rText || !jText) {
            showToast("Both Resume and Job Description text are required for match alignment analysis!", "error");
            return;
        }

        alignmentModal.classList.add("active");
        alignmentModalBody.innerHTML = `
            <div class="loading-spinner-box">
                <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
                <p>Computing match percentage, skill gaps, and strengths...</p>
            </div>
        `;

        fetch("/api/analyze-alignment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume_text: rText, jd_text: jText, provider: state.provider })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                renderAlignmentDashboard(data.data);
            } else {
                alignmentModalBody.innerHTML = `<p class="text-error">Alignment calculation error: ${data.error}</p>`;
            }
        })
        .catch(err => {
            console.error(err);
            alignmentModalBody.innerHTML = `<p class="text-error">API Connection error.</p>`;
        });
    });

    function renderAlignmentDashboard(alignment) {
        const score = alignment.overall_match_score || 85;
        const scoreDeg = (score / 100) * 360;

        alignmentModalBody.innerHTML = `
            <div class="alignment-header-box">
                <div class="score-circle" style="--score-deg: ${scoreDeg}deg;">
                    <span class="score-value">${score}%</span>
                </div>
                <div class="alignment-meta-info">
                    <span class="fit-badge">${alignment.fit_level || 'Strong Alignment'}</span>
                    <h3 style="font-size:18px; font-weight:700;">Role & Resume Match Score</h3>
                    <p style="font-size:13px; color:var(--text-secondary);">Skills Match: ${alignment.skills_match_score || score}% | Experience Match: ${alignment.experience_match_score || score}% | Domain Fit: ${alignment.domain_match_score || score}%</p>
                </div>
            </div>

            <div class="alignment-grid">
                <div class="alignment-card">
                    <h4 style="color:#10B981;"><i class="fa-solid fa-circle-check"></i> Matching Key Skills</h4>
                    <ul class="list-check">
                        ${(alignment.matching_key_skills || []).map(s => `<li><i class="fa-solid fa-check text-success"></i> ${s}</li>`).join('')}
                    </ul>
                </div>
                <div class="alignment-card">
                    <h4 style="color:#EF4444;"><i class="fa-solid fa-triangle-exclamation"></i> Missing / Skill Gaps</h4>
                    <ul class="list-cross">
                        ${(alignment.missing_or_gap_skills || []).map(g => `<li><i class="fa-solid fa-xmark text-danger"></i> ${g}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div style="margin-top:20px;">
                <h4 style="font-size:14px; font-weight:700; margin-bottom:8px;"><i class="fa-solid fa-thumbs-up"></i> Key Candidate Strengths</h4>
                <ul style="padding-left:20px; font-size:13px; color:var(--text-secondary);">
                    ${(alignment.strengths || []).map(str => `<li style="margin-bottom:4px;">${str}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    closeAlignmentModalBtn.addEventListener("click", () => alignmentModal.classList.remove("active"));

    // --- Primary Action: Launch Live AI HR Interview ---
    launchInterviewBtn.addEventListener("click", () => {
        state.candidateName = (candidateNameInput ? candidateNameInput.value.trim() : "") || state.candidateName || "Candidate";
        state.jobTitle = (jobTitleInput ? jobTitleInput.value.trim() : "") || state.jobTitle || "Senior Software Engineer";
        state.numQuestions = (numQuestionsSelect ? parseInt(numQuestionsSelect.value, 10) : 10) || 10;

        // Display modal
        interviewModal.classList.add("active");
        interviewLoadingState.style.display = "block";
        interviewArena.style.display = "none";
        finalAssessmentContainer.style.display = "none";

        currentAccentDisplay.textContent = `${state.accent} Accent ${state.accent === 'Indian' ? '🇮🇳' : '🌐'}`;

        // Fetch questions
        fetch("/api/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                candidate_name: state.candidateName,
                job_title: state.jobTitle,
                num_questions: state.numQuestions,
                accent: state.accent,
                resume_text: resumeTextarea.value,
                jd_text: jdTextarea.value,
                provider: state.provider
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data && data.data.questions) {
                state.interviewSession.questions = data.data.questions;
                state.interviewSession.currentIndex = 0;
                state.interviewSession.answers = [];
                state.interviewSession.evaluations = [];
                state.interviewSession.secondsElapsed = 0;

                startTimer();
                renderCurrentQuestion();
                interviewLoadingState.style.display = "none";
                interviewArena.style.display = "grid";
            } else {
                showToast("Failed to generate interview questions", "error");
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Connection error while starting interview", "error");
        });
    });

    function startTimer() {
        if (state.interviewSession.timerInterval) clearInterval(state.interviewSession.timerInterval);
        state.interviewSession.timerInterval = setInterval(() => {
            state.interviewSession.secondsElapsed++;
            const mins = Math.floor(state.interviewSession.secondsElapsed / 60).toString().padStart(2, '0');
            const secs = (state.interviewSession.secondsElapsed % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    function renderCurrentQuestion() {
        const qIndex = state.interviewSession.currentIndex;
        const qList = state.interviewSession.questions;
        const q = qList[qIndex];

        qCurrentIndex.textContent = qIndex + 1;
        qTotalCount.textContent = qList.length;

        qCategoryPill.textContent = q.category || "Technical & Behavioral";
        questionText.textContent = q.question;

        evalPointsList.innerHTML = (q.key_eval_points || []).map(p => `<li>${p}</li>`).join('');

        candidateAnswerTextarea.value = "";
        feedbackResultCard.style.display = "none";
        submitAnswerBtn.style.display = "flex";

        // Speak question automatically with TTS!
        speakQuestionText(q.question);
    }

    // --- Web Speech Synthesis (Text to Speech) ---
    function speakQuestionText(text) {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (state.accent === "Indian") {
            selectedVoice = voices.find(v => v.lang.includes("en-IN") || v.name.includes("India") || v.name.includes("Hindi"));
            utterance.pitch = 1.0;
            utterance.rate = 0.95;
        } else {
            selectedVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        window.speechSynthesis.speak(utterance);
    }

    speakQuestionBtn.addEventListener("click", () => {
        const qIndex = state.interviewSession.currentIndex;
        const q = state.interviewSession.questions[qIndex];
        if (q) speakQuestionText(q.question);
    });

    // --- Web Speech Recognition (Candidate Voice Input) ---
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.interviewSession.recognition = new SpeechRecognition();
        state.interviewSession.recognition.continuous = true;
        state.interviewSession.recognition.interimResults = true;

        state.interviewSession.recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            candidateAnswerTextarea.value = transcript;
        };

        state.interviewSession.recognition.onend = () => {
            state.interviewSession.isListening = false;
            micBtnText.textContent = "Start Voice Input";
            micToggleBtn.style.background = "#EF4444";
        };
    }

    micToggleBtn.addEventListener("click", () => {
        if (!state.interviewSession.recognition) {
            showToast("Speech Recognition not supported in your browser. Please type your answer.", "info");
            return;
        }

        if (state.interviewSession.isListening) {
            state.interviewSession.recognition.stop();
            state.interviewSession.isListening = false;
            micBtnText.textContent = "Start Voice Input";
            micToggleBtn.style.background = "#EF4444";
        } else {
            state.interviewSession.recognition.start();
            state.interviewSession.isListening = true;
            micBtnText.textContent = "Listening... (Click to Stop)";
            micToggleBtn.style.background = "#10B981";
        }
    });

    // --- Submit Answer & Get AI Feedback ---
    submitAnswerBtn.addEventListener("click", () => {
        const answer = candidateAnswerTextarea.value.trim();
        if (!answer) {
            showToast("Please enter or dictate your response before submitting!", "error");
            return;
        }

        const qIndex = state.interviewSession.currentIndex;
        const q = state.interviewSession.questions[qIndex];

        submitAnswerBtn.disabled = true;
        submitAnswerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Evaluating Answer...`;

        fetch("/api/evaluate-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: q.question,
                candidate_answer: answer,
                job_title: state.jobTitle,
                key_eval_points: q.key_eval_points,
                provider: state.provider
            })
        })
        .then(res => res.json())
        .then(data => {
            submitAnswerBtn.disabled = false;
            submitAnswerBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Answer for AI Feedback`;

            if (data.success && data.data) {
                const evalRes = data.data;
                state.interviewSession.answers.push(answer);
                state.interviewSession.evaluations.push(evalRes);

                feedbackScoreBadge.textContent = `${evalRes.score || 8} / 10`;
                feedbackPositive.textContent = evalRes.positive_feedback || "Solid response.";
                feedbackImprovement.textContent = evalRes.areas_for_improvement || "None noted.";

                feedbackResultCard.style.display = "block";
                submitAnswerBtn.style.display = "none";
            }
        })
        .catch(err => {
            console.error(err);
            submitAnswerBtn.disabled = false;
            submitAnswerBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Answer for AI Feedback`;
            showToast("Error evaluating answer", "error");
        });
    });

    // --- Next Question / Complete Interview ---
    nextQuestionBtn.addEventListener("click", () => {
        state.interviewSession.currentIndex++;
        if (state.interviewSession.currentIndex < state.interviewSession.questions.length) {
            renderCurrentQuestion();
        } else {
            finishInterview();
        }
    });

    function finishInterview() {
        if (state.interviewSession.timerInterval) clearInterval(state.interviewSession.timerInterval);

        interviewArena.style.display = "none";
        finalAssessmentContainer.style.display = "block";

        const evals = state.interviewSession.evaluations;
        const totalScore = evals.reduce((sum, e) => sum + (e.score || 0), 0);
        const avgScore = evals.length > 0 ? (totalScore / evals.length).toFixed(1) : 8.5;

        assessmentSummaryGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; font-weight: 800; color: #10B981; font-family: var(--font-heading);">${avgScore} / 10</div>
                <p style="font-size: 14px; color: #94A3B8;">Overall Candidate Performance Score</p>
            </div>
            ${evals.map((e, idx) => `
                <div class="alignment-card" style="background:#1C2541; border-color:#3A506B;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span style="font-weight:700; color:#60A5FA;">Q${idx+1}: ${state.interviewSession.questions[idx].category}</span>
                        <span style="background:#10B981; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:10px;">${e.score}/10</span>
                    </div>
                    <p style="font-size:12px; color:#CBD5E1; margin-bottom:6px;"><strong>Question:</strong> ${state.interviewSession.questions[idx].question}</p>
                    <p style="font-size:12px; color:#94A3B8;"><strong>Feedback:</strong> ${e.positive_feedback}</p>
                </div>
            `).join('')}
        `;
    }

    exitInterviewBtn.addEventListener("click", () => {
        if (state.interviewSession.timerInterval) clearInterval(state.interviewSession.timerInterval);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        interviewModal.classList.remove("active");
    });

    restartInterviewBtn.addEventListener("click", () => {
        finalAssessmentContainer.style.display = "none";
        state.interviewSession.currentIndex = 0;
        state.interviewSession.answers = [];
        state.interviewSession.evaluations = [];
        state.interviewSession.secondsElapsed = 0;
        startTimer();
        renderCurrentQuestion();
        interviewArena.style.display = "grid";
    });

    downloadReportBtn.addEventListener("click", () => {
        const report = {
            candidate: state.candidateName,
            job_title: state.jobTitle,
            date: new Date().toISOString(),
            questions_and_evaluations: state.interviewSession.questions.map((q, idx) => ({
                question: q.question,
                answer: state.interviewSession.answers[idx] || "N/A",
                evaluation: state.interviewSession.evaluations[idx] || {}
            }))
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${state.candidateName.replace(/\s+/g, '_')}_Interview_Report.json`;
        a.click();
        showToast("Downloaded complete interview evaluation report!", "success");
    });

});
