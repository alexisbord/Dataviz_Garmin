# Dataviz_Garmin

This repository is a **personal data visualization tool** built around Garmin health/activity exports. It consists of a lightweight Flask backend that serves data from local Garmin SQLite databases and a frontend application to display running paths, sleep summaries, and other health metrics.

![alt text](<cumulative_dist.png>)
![alt text](<beeswarm.png>)

## Project Overview

- **Backend** (`backend/`): Python/Flask service exposing REST endpoints pulling from SQLite databases located in `Data/DBs`.
- **Frontend** (`frontend/`): application (created with Vite) that fetches from the Flask API and renders dashboards using D3 and simple HTML/CSS.
- **Data**: Garmin export databases (`garmin_activities.db`, `garmin.db`, etc.) hold activities, records, sleep, and other metrics. Place them in `Data/DBs` or point the backend at wherever you keep them. You can generate these files yourself or simply clone/run the upstream project `tcgoetz/GarminDB` which automates downloading and building the SQLite databases.


## Directory Structure

```
Data/DBs/               # Place your Garmin SQLite exports here
Dataviz_Garmin/
├── backend/            # Flask app & helper script
│   ├── app.py          # API implementation
│   └── make.py         # Convenience wrapper to run make in garminDB repo
├── frontend/           # Vite client
│   ├── public/         # static html templates
│   └── src/            # # Frontend source (visualizations, components, styles)
├── LICENSE
└── README.md           # <-- you are here
```

## Data Sources

The backend connects to two SQLite databases:

- `garmin_activities.db`: contains activity summaries and detailed records.
- `garmin.db`: holds additional data such as sleep entries.

Database paths are configured via environment variables (see **Configuration** below) with defaults pointing to `Data/DBs`.

These files are normally created by exporting your Garmin Connect data or via the companion `garmindb` project (see `backend/make.py` for invocation).

## Configuration

Environment variables control the paths to database files and the GarminDB repository. To configure:

1. **Copy the example file**:
   ```bash
   cd Dataviz_Garmin/backend
   copy .env.example .env
   ```

2. **Edit `.env`** to match your setup:
   - `GARMIN_DB_DIR`: directory containing both `garmin_activities.db` and `garmin.db`
   - `GARMIN_ACTIVITIES_DB`: (optional) full path to `garmin_activities.db` if in a different location
   - `GARMIN_DB`: (optional) fuzation
   - `GARMINDB_TARGET_DIR`: directory containing the `GarminDB` repository (for `make.py`)

3. **Load the environment** before running the backend:
   - **PowerShell**: Load-Content .env and set each variable, or source it manually
   - **Bash**: `set -a; source .env; set +a`
   - **IDE/Editor**: Most IDEs can load `.env` automatically (check your configuration)

## Setup & Usage

1. **Python environment**: ensure you have a virtualenv or conda env with dependencies installed. Activate the workspace environment (e.g. `& .venv\Scripts\Activate.ps1`).

2. **Backend**:
   ```powershell
   cd Dataviz_Garmin/backend
   python -m pip install flask flask-cors
   python app.py
   ```
   The service listens on `http://127.0.0.1:5000` by default.

3. **Frontend**:
   ```bash
   cd Dataviz_Garmin/frontend
   npm install            # install dependencies
   npm start              # start development server
   ```
   Open `http://localhost:3000` (or the port indicated) in your browser.

   The frontend assumes the backend is reachable at `http://127.0.0.1:5000`.

4. **Database sync (optional)**:
   The `backend/make.py` script simply forwards `make` commands to your copy of the `garmindb` repository. Run it if you need to rebuild the SQLite exports:
   ```bash
   cd Dataviz_Garmin/backend
   python make.py all    # or other make targets
   ```
---
