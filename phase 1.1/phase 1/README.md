# eliora-phase1

## Eliora AI HR - Autonomous AI Interview Platform (Phase 1)

Eliora is an interactive AI HR Interviewing platform featuring:
- **Exclusive AI Avatar Interviewer**: Eliora female AI agent with synchronized MP4 video lip-syncing.
- **Side-by-Side Dual Video Stage**: Simultaneous view of Eliora AI Agent and live Candidate Camera.
- **Dedicated Question Focus Window**: Dynamic step dots (`1/2/3`) and sequential question transition animations.
- **Fresh Screen Per Question**: Clean screen layout after every answer submission.
- **Strict Scoring Engine**: 5-metric scoring (Technical Knowledge, Communication Clarity, Relevance, Delivery Confidence, Overall Quality) with 0-score enforcement for skipped/silent responses.
- **Automatic Session Conclusion**: Automatic end-of-interview report generation.

### Quick Start
```bash
# Install dependencies
pip install -r requirements.txt

# Run live application server
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.
