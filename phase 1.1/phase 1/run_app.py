import os
import sys
import subprocess

def install_requirements():
    """Installs dependencies listed in requirements.txt."""
    print("Checking and installing dependencies...")
    req_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
    if not os.path.exists(req_file):
        print(f"requirements.txt not found at {req_file}!")
        return

    # Try to use uv if installed for fast package management, otherwise fallback to pip
    try:
        # Check if uv is installed
        subprocess.run(["uv", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print("Using 'uv' for fast installation...")
        subprocess.run(["uv", "pip", "install", "-r", req_file], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Using standard 'pip' for installation...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", req_file], check=True)

def main():
    # Install dependencies
    install_requirements()
    
    print("\n" + "="*50)
    print("Launching Eliora AI Interview Platform server...")
    print("Once launched, open your web browser and navigate to:")
    print("  http://127.0.0.1:8000")
    print("="*50 + "\n")
    
    # Run uvicorn server
    try:
        import uvicorn
        uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
    except ImportError:
        print("Error: uvicorn failed to import even after installation. Please run manual check.")
        sys.exit(1)

if __name__ == "__main__":
    main()
