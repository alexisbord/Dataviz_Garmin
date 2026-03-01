from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Configure DB paths via environment variables to avoid hard-coding absolute paths.
# Supported env vars:
# - GARMIN_DB_DIR -> directory containing DB files (overrides defaults)
# - GARMIN_ACTIVITIES_DB -> full path to garmin_activities.db
# - GARMIN_DB -> full path to garmin.db
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEFAULT_DB_DIR = os.environ.get('GARMIN_DB_DIR') or os.path.join(BASE_DIR, 'Data', 'DBs')

DB_PATH_ACTIVITIES = os.environ.get('GARMIN_ACTIVITIES_DB') or os.path.join(DEFAULT_DB_DIR, 'garmin_activities.db')
DB_PATH_GARMIN = os.environ.get('GARMIN_DB') or os.path.join(DEFAULT_DB_DIR, 'garmin.db')

@app.route('/api/running-data')
def get_running_distances():
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()
    cur.execute("SELECT activity_id, start_time, distance, avg_speed FROM activities WHERE distance IS NOT NULL AND sport = 'running'")
    data = cur.fetchall()
    conn.close()
    result = [
        {
            'activity_id': row[0],
            'start_time': row[1],
            'distance': row[2],
            'avg_speed': row[3]
        }
        for row in data
    ]
    return jsonify(result)

@app.route('/api/last-run-records')
def get_last_run():
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()
    cur.execute("SELECT record, position_lat, position_long FROM activity_records WHERE activity_id = (SELECT activity_id FROM activities WHERE sport = 'running' ORDER BY start_time DESC LIMIT 1)")
    records = cur.fetchall()
    conn.close()
    result = [
        {'record': row[0], 'lat': row[1], 'long': row[2]}
        for row in records
    ]
    return jsonify(result)

# 11589864463
@app.route('/api/records-by-id=<int:activity_id>')
def get_records_by_id(activity_id):
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()
    cur.execute("SELECT record, position_lat, position_long, distance, hr, speed  FROM activity_records WHERE activity_id = ?", (activity_id,))
    records = cur.fetchall()
    cur.execute("SELECT activity_id, start_time, stop_time, distance, avg_speed FROM activities WHERE activity_id = ?", (activity_id,))
    activity_data = cur.fetchone()
    conn.close()
    
    result = [
        {'record': row[0], 'lat': row[1], 'long': row[2], 'distance': row[3], 'hr': row[4], 'speed': row[5]}
        for row in records
    ]

    result_activity = {
        'activity_id': activity_data[0],
        'start_time': activity_data[1],
        'stop_time': activity_data[2],
        'distance': activity_data[3],
        'avg_speed': activity_data[4],
        'records': result
    }

    return jsonify(result_activity)

@app.route('/api/last-run-data')
def get_last_run_data():
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()
    cur.execute("SELECT activity_id, start_time, stop_time, distance, avg_speed FROM activities WHERE activity_id = (SELECT activity_id FROM activities WHERE sport = 'running' ORDER BY start_time DESC LIMIT 1)")
    data = cur.fetchone()
    conn.close()
    result = {
        'activity_id': data[0],
        'start_time': data[1],
        'stop_time': data[2],
        'distance': data[3],
        'avg_speed': data[4]
    }
    return jsonify(result)

@app.route('/api/last-week-sleep')
def get_last_week_sleep():
    conn = sqlite3.connect(DB_PATH_GARMIN)
    cur = conn.cursor()
    cur.execute("SELECT start, end, total_sleep FROM sleep ORDER BY start DESC LIMIT 7")
    data = cur.fetchall()
    conn.close()
    result = [
        {
            'start': row[0],
            'end': row[1],
            'total_sleep': row[2]
        }
        for row in data
    ]
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
