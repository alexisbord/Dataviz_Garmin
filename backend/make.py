import os
import subprocess
import sys

# Define the target directory (expand ~ to full path)
target_dir = os.path.expanduser("~/onedrive/documents/5_course/healthdata/garmindb")

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
