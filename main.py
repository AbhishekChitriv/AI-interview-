import os
import sys
from pathlib import Path

# Add the JobJugad package directory to sys.path
APP_DIR = Path(__file__).resolve().parent / "Jobjugad Agent" / "jobjugad"
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

# Import the FastAPI ASGI app from jobjugad
from jobjugad import app  # noqa: E402, F401

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
