import importlib.util
import os
import sys
from pathlib import Path

# Path to the actual jobjugad directory and module
APP_DIR = Path(__file__).resolve().parent / "Jobjugad Agent" / "jobjugad"
MODULE_PATH = APP_DIR / "jobjugad.py"

if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

# Dynamically load the inner jobjugad module to avoid self-referencing circular import
spec = importlib.util.spec_from_file_location("_inner_jobjugad", MODULE_PATH)
if spec is None or spec.loader is None:
    raise ImportError(f"Could not load module from {MODULE_PATH}")
_inner_module = importlib.util.module_from_spec(spec)
sys.modules["_inner_jobjugad"] = _inner_module
spec.loader.exec_module(_inner_module)

app = getattr(_inner_module, "app")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
