# Dataviz_Garmin

This repository is a **personal data visualization tool** built around Garmin health/activity exports. It consists of a lightweight Flask backend that serves data from local Garmin SQLite databases and a React-based frontend to display running paths, sleep summaries, and other health metrics.

## Project Overview

- **Backend** (`backend/`): Python/Flask service exposing REST endpoints pulling from SQLite databases located in `Data/DBs`.
- **Frontend** (`frontend/`): React application (created with Vite) that fetches from the Flask API and renders dashboards using D3 and simple HTML/CSS.
- **Data**: Garmin export databases such as `garmin_activities.db` and `garmin.db` contain activities, records, sleep, and other metrics. These are expected under `Data/DBs`.

## Directory Structure

```
Dataviz_Garmin/
├── backend/            # Flask app & helper script
│   ├── app.py          # API implementation
│   └── make.py         # Convenience wrapper to run make in garminDB repo
├── frontend/           # React/Vite client
│   ├── public/         # static html templates
│   └── src/            # React source (pages, styles, components)
├── LICENSE
└── README.md           # <-- you are here
```

## Data Sources

The backend connects to two SQLite databases defined with absolute paths in `app.py`:

- `garmin_activities.db`: contains activity summaries and detailed records.
- `garmin.db`: holds additional data such as sleep entries.

These files are normally created by exporting your Garmin Connect data or via the companion `garmindb` project (see `backend/make.py` for invocation).

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
   npm install            # or yarn
   npm run dev            # start development server
   ```
   Open `http://localhost:3000` (or the port indicated) in your browser.

   The React app assumes the backend is reachable at `http://127.0.0.1:5000` – adjust `fetch` URLs in the source if you change this.

4. **Database sync (optional)**:
   The `backend/make.py` script simply forwards `make` commands to your copy of the `garmindb` repository. Run it if you need to rebuild the SQLite exports:
   ```bash
   cd Dataviz_Garmin/backend
   python make.py all    # or other make targets
   ```

## API Endpoints

| Route                         | Description                                  |
|------------------------------|----------------------------------------------|
| `/api/running-data`          | All running activities (id, time, dist, spd) |
| `/api/last-run-records`      | GPS track of the most recent run             |
| `/api/records-by-id=<id>`    | Detailed records & summary for a given id    |
| `/api/last-run-data`         | Summary of the most recent run               |
| `/api/last-week-sleep`       | Sleep entries for the past 7 days            |

## Notes & Tips

- Latitude/longitude values are stored as Garmin "semicircles"; the frontend converts them using `lat * (180 / 2**31)`.
- Speeds, distances, and times are normalized in the backend before being sent to the client.
- You can customize or extend both backend and frontend as needed if you want to add more endpoints (e.g., cycling, steps) or visualizations (maps, charts).

---