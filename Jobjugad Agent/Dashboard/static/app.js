/* ==========================================================================
   JobJugad - Candidate Dashboard (standalone)
   Dashboard-only frontend engine: stats, score trend, session history,
   recorded-video playback and a printable performance report.
   ========================================================================== */

// ── GLOBAL STATE ─────────────────────────────────────────────────────────────
const state = {
    currentTab: 'dashboard',
    candidateName: 'Candidate',
    jobTitle: 'Software Candidate',
    history: [],
};

let trendChartInstance = null;

// ── INITIALIZATION ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadSessionProfile();
    loadHistory();
    renderDashboard();
});

async function loadSessionProfile() {
    try {
        const res = await fetch('/api/session');
        if (res.ok) {
            const data = await res.json();
            const el = document.getElementById('dash-user-name');
            if (el) {
                el.textContent = (data.candidate_name && data.candidate_name !== 'Candidate') ? data.candidate_name : 'Candidate';
            }
        }
    } catch (e) {
        console.warn('Could not load session profile:', e);
    }
}

// ── NAVIGATION (single tab, kept for UI parity) ──────────────────────────────
function switchNavTab(tabName) {
    state.currentTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-tab').forEach(view => view.classList.remove('active'));
    const btn = document.getElementById(`tab-btn-${tabName}`);
    const view = document.getElementById(`view-${tabName}`);
    if (btn) btn.classList.add('active');
    if (view) view.classList.add('active');
    if (tabName === 'dashboard') renderDashboard();
}

// ── DASHBOARD RENDER ─────────────────────────────────────────────────────────
function renderDashboard() {
    const totalCount = state.history.length;
    document.getElementById('stat-total-count').textContent = totalCount;

    if (totalCount > 0) {
        const scores = state.history.map(h => h.score || 0);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const highest = Math.max(...scores);
        document.getElementById('stat-avg-score').textContent = `${avg}%`;
        document.getElementById('stat-highest-score').textContent = `${highest}%`;

        // Most frequent target role -> "Top Skill Focus"
        const roleCounts = {};
        state.history.forEach(h => {
            const r = h.jobTitle || 'General';
            roleCounts[r] = (roleCounts[r] || 0) + 1;
        });
        const topRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0][0];
        document.getElementById('stat-top-skill').textContent = topRole;
    }

    renderHistoryTable();
    renderTrendChart();
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;
    const searchVal = (document.getElementById('history-search')?.value || '').toLowerCase();
    tbody.innerHTML = '';

    const filtered = state.history.filter(h =>
        (h.candidateName || '').toLowerCase().includes(searchVal) ||
        (h.jobTitle || '').toLowerCase().includes(searchVal)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No matching sessions found.</td></tr>`;
        return;
    }

    filtered.forEach(session => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${session.date || '--'}</td>
            <td><strong>${session.jobTitle || 'General'}</strong></td>
            <td><span class="badge badge-amber">${session.score ?? 0}%</span></td>
            <td><span class="badge badge-green">${session.recommendation || '--'}</span></td>
            <td>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn-primary-sm" onclick="viewSessionReport('${session.id}')">Report</button>
                    <button class="btn-primary-sm" onclick="playSessionRecording('${session.id}')">Video</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderTrendChart() {
    const canvas = document.getElementById('trend-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    if (trendChartInstance) trendChartInstance.destroy();

    const hasData = state.history.length > 0;
    const dataPoints = hasData
        ? state.history.slice().reverse().map(h => h.score || 0)
        : [72, 78, 85, 88, 92];
    const labels = hasData
        ? state.history.slice().reverse().map((h, i) => `Session ${i + 1}`)
        : ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5'];

    trendChartInstance = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Candidate Score Trend',
                data: dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ── HISTORY MODAL ────────────────────────────────────────────────────────────
function openHistoryModal() {
    const overlay = document.getElementById('history-modal-overlay');
    if (overlay) overlay.classList.add('open');
    renderHistoryTable();
}

function closeHistoryModal() {
    const overlay = document.getElementById('history-modal-overlay');
    if (overlay) overlay.classList.remove('open');
}

// ── VIDEO PLAYER MODAL ───────────────────────────────────────────────────────
function playSessionRecording(sessionId) {
    const session = state.history.find(h => h.id === sessionId);
    const player = document.getElementById('session-recording-player');
    const url = (session && session.videoBlobUrl) ? session.videoBlobUrl : `/api/history/video/${sessionId}`;
    player.src = url;
    document.getElementById('video-download-link').href = url;
    document.getElementById('video-modal-overlay').classList.add('open');
}

function closeVideoModal() {
    const player = document.getElementById('session-recording-player');
    if (player) { player.pause(); player.removeAttribute('src'); player.load(); }
    document.getElementById('video-modal-overlay').classList.remove('open');
}

async function openHistoryFolder() {
    try {
        await fetch('/api/open-history-folder');
        showToast('Opening Interview Recordings History folder...');
    } catch (e) {
        showToast('Could not open history folder.');
    }
}

// ── PERFORMANCE REPORT (opens printable page in a new tab) ───────────────────
function viewSessionReport(sessionId) {
    const session = state.history.find(h => h.id === sessionId);
    if (!session || !session.report) {
        showToast('No report data stored for this session.');
        return;
    }
    const html = generateCleanReportHTML(session.report);
    const win = window.open('', '_blank');
    if (!win) {
        showToast('Please allow popups to view the report.');
        return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
}

function generateCleanReportHTML(report) {
    const candidateName = report.candidate_name || state.candidateName || 'Candidate';
    const jobTitle = report.job_title || state.jobTitle || 'Target Role';
    const overallScore = report.overall_score ?? 0;
    const recommendation = report.recommendation || 'Evaluation Complete';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const metrics = report.radar_metrics || {
        'Technical Knowledge': 0, 'Communication': 0, 'Relevance': 0, 'Confidence': 0, 'Answer Quality': 0
    };
    let compHtml = '';
    for (const [key, val] of Object.entries(metrics)) {
        const barColor = val >= 80 ? '#059669' : (val >= 65 ? '#d97706' : '#dc2626');
        compHtml += `
            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;font-weight:600;font-size:13px;margin-bottom:4px;color:#1e293b;">
                    <span>${key}</span><span>${val}%</span>
                </div>
                <div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                    <div style="width:${val}%;height:100%;background:${barColor};border-radius:4px;"></div>
                </div>
            </div>`;
    }

    const strengths = report.top_strengths || [];
    const strengthsHtml = strengths.map(s => `<li style="margin-bottom:6px;color:#15803d;"><strong>&check;</strong> ${s}</li>`).join('');
    const weaknesses = report.top_weaknesses || [];
    const weaknessesHtml = weaknesses.map(w => `<li style="margin-bottom:6px;color:#b45309;"><strong>&#9889;</strong> ${w}</li>`).join('');
    const roadmap = report.improvement_roadmap || [];
    const roadmapHtml = roadmap.map(step => `
        <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:10px 14px;margin-bottom:8px;border-radius:0 6px 6px 0;font-size:13px;color:#334155;">${step}</div>
    `).join('');

    const evals = report.individual_evaluations || [];
    let evalsHtml = '';
    evals.forEach((ev, idx) => {
        const qScore = ev.overall_score ?? 0;
        const qScoreColor = qScore >= 80 ? '#059669' : (qScore >= 65 ? '#d97706' : '#dc2626');
        const qCategory = ev.category || 'Technical';
        const qText = ev.question || `Question ${idx + 1}`;
        const ansText = ev.candidate_answer || 'No response recorded.';
        const qStrengths = ev.strengths || [];
        const qWeaknesses = ev.weaknesses || [];
        const qFeedback = ev.feedback || '';
        const idealPoints = ev.ideal_answer_points || [];
        evalsHtml += `
            <div style="border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin-bottom:16px;page-break-inside:avoid;background:#fff;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
                    <div>
                        <span style="background:#e0f2fe;color:#0369a1;font-weight:700;font-size:11px;padding:2px 8px;border-radius:12px;margin-right:8px;text-transform:uppercase;">Question ${idx + 1} &bull; ${qCategory}</span>
                        <h4 style="display:inline;font-size:14px;font-weight:700;color:#0f172a;margin:0;">${qText}</h4>
                    </div>
                    <span style="background:${qScoreColor}15;color:${qScoreColor};font-weight:800;font-size:13px;padding:4px 10px;border-radius:16px;border:1px solid ${qScoreColor};">Score: ${qScore}/100</span>
                </div>
                <div style="background:#f8fafc;border-left:3px solid #64748b;padding:8px 12px;font-size:12.5px;color:#475569;margin-bottom:10px;font-style:italic;">
                    <strong>Candidate Answer:</strong> "${ansText}"
                </div>
                ${qFeedback ? `<p style="font-size:12.5px;color:#334155;margin-bottom:8px;"><strong>Evaluator Feedback:</strong> ${qFeedback}</p>` : ''}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;font-size:12px;">
                    ${qStrengths.length ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;"><strong style="color:#166534;">&check; Answer Strengths:</strong><ul style="margin:4px 0 0 16px;padding:0;color:#15803d;">${qStrengths.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
                    ${qWeaknesses.length ? `<div style="background:#fffbeb;border:1px solid #fef08a;border-radius:6px;padding:8px 12px;"><strong style="color:#92400e;">&#9889; Gaps / Areas to Improve:</strong><ul style="margin:4px 0 0 16px;padding:0;color:#b45309;">${qWeaknesses.map(w => `<li>${w}</li>`).join('')}</ul></div>` : ''}
                </div>
                ${idealPoints.length ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;font-size:12px;"><strong style="color:#1e40af;">&#128161; Key Model Answer Points:</strong><ul style="margin:4px 0 0 16px;padding:0;color:#1d4ed8;">${idealPoints.map(p => `<li>${p}</li>`).join('')}</ul></div>` : ''}
            </div>`;
    });

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Interview Assessment Report - ${candidateName}</title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a; background:#fff; margin:0; padding:24px; line-height:1.5; }
.report-header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #2563eb; padding-bottom:16px; margin-bottom:20px; }
.header-title h1 { font-size:22px; margin:0 0 4px 0; }
.header-title p { margin:0; font-size:13px; color:#64748b; }
.score-badge-box { text-align:center; background:#f8fafc; border:2px solid #2563eb; border-radius:12px; padding:8px 16px; }
.score-num-big { font-size:28px; font-weight:800; color:#2563eb; line-height:1; }
.rec-pill { display:inline-block; margin-top:4px; font-size:11px; font-weight:700; padding:2px 10px; border-radius:10px; background:#2563eb; color:#fff; text-transform:uppercase; }
.section-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:18px; page-break-inside:avoid; }
.section-title { font-size:15px; font-weight:700; color:#1e293b; margin:0 0 12px 0; border-bottom:1px solid #f1f5f9; padding-bottom:6px; }
.grid-2col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
ul { margin:0; padding-left:18px; } li { margin-bottom:4px; font-size:12.5px; }
</style></head><body>
<div class="report-header">
    <div class="header-title">
        <h1>${candidateName}</h1>
        <p><strong>Target Role:</strong> ${jobTitle} | <strong>Assessment Date:</strong> ${dateStr}</p>
        <p style="margin-top:4px;font-size:11px;color:#94a3b8;">Official AI Candidate Performance &amp; Coaching Report</p>
    </div>
    <div class="score-badge-box">
        <div class="score-num-big">${overallScore}<span style="font-size:14px;color:#64748b;">/100</span></div>
        <div class="rec-pill">${recommendation}</div>
    </div>
</div>
<div class="section-card"><h3 class="section-title">Executive Performance Summary</h3><p style="font-size:13px;color:#334155;margin:0;">${report.summary || ''}</p></div>
<div class="section-card"><h3 class="section-title">Core Competency Performance Breakdown</h3><div class="grid-2col">${compHtml}</div></div>
<div class="grid-2col" style="margin-bottom:18px;">
    <div class="section-card" style="margin-bottom:0;"><h3 class="section-title" style="color:#15803d;">Key Strengths &amp; Mastery</h3><ul>${strengthsHtml}</ul></div>
    <div class="section-card" style="margin-bottom:0;"><h3 class="section-title" style="color:#b45309;">Priority Areas for Growth &amp; Gaps</h3><ul>${weaknessesHtml}</ul></div>
</div>
<div class="section-card"><h3 class="section-title" style="color:#2563eb;">Actionable Step-by-Step Improvement Roadmap</h3>${roadmapHtml}</div>
<div class="section-card"><h3 class="section-title">Hiring Panel Verdict &amp; Closing Guidance</h3><p style="font-size:13px;color:#334155;margin:0;">${report.hiring_note || ''}</p></div>
<div style="margin-top:24px;"><h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">Detailed Question-by-Question Evaluation &amp; Model Answers</h3>${evalsHtml}</div>
<div style="text-align:center;margin-top:24px;"><button onclick="window.print()" style="background:#2563eb;color:#fff;border:0;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;">Print / Save as PDF</button></div>
</body></html>`;
}

// ── HISTORY LOAD ─────────────────────────────────────────────────────────────
async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        if (res.ok) {
            state.history = await res.json();
            renderDashboard();
        }
    } catch (e) {
        console.error('Error loading history from backend:', e);
    }
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:rgba(15,23,42,0.95);color:#f8fafc;border:1px solid var(--primary-yellow);padding:12px 20px;border-radius:var(--radius-md);box-shadow:0 10px 30px rgba(0,0,0,0.5);font-size:0.88rem;z-index:200;transition:all 0.3s ease;`;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}
