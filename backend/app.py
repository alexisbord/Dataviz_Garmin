from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

DB_PATH_ACTIVITIES = os.path.abspath(r'C:\Users\alexi\OneDrive\Documents\5_Course\HealthData\Data\DBs\garmin_activities.db')
DB_PATH_GARMIN = os.path.abspath(r'C:\Users\alexi\OneDrive\Documents\5_Course\HealthData\Data\DBs\garmin.db')

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
