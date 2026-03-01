import os
import subprocess
import sys

# Configure target directory via environment variable to avoid hard-coding absolute paths.
# Supported env vars:
# - GARMINDB_TARGET_DIR -> directory containing GarminDB (overrides defaults)
# Fallback: relative path to GarminDB from current directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TARGET = os.path.join(BASE_DIR, '..', '..', 'GarminDB')
target_dir = os.environ.get('GARMINDB_TARGET_DIR') or os.path.abspath(DEFAULT_TARGET)

# Check if the directory exists
if not os.path.isdir(target_dir):
    print(f"Directory not found: {target_dir}")
    sys.exit(1)

# Optional: get additional make arguments from the command line
make_args = sys.argv[1:]

# Run make in the target directory
try:
    subprocess.run(["make"] + make_args, cwd=target_dir, check=True)
except subprocess.CalledProcessError as e:
    print(f"Make failed with error code {e.returncode}")
    sys.exit(e.returncode)
