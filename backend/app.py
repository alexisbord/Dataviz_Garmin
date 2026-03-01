from flask import Flask, jsonify
import sqlite3
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# DB configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEFAULT_DB_DIR = os.environ.get('GARMIN_DB_DIR') or os.path.join(BASE_DIR, 'Data', 'DBs')

DB_PATH_ACTIVITIES = os.environ.get('GARMIN_ACTIVITIES_DB') or os.path.join(DEFAULT_DB_DIR, 'garmin_activities.db')
DB_PATH_GARMIN = os.environ.get('GARMIN_DB') or os.path.join(DEFAULT_DB_DIR, 'garmin.db')


@app.route('/api/running-activities', methods=['GET'])
def get_running_activities():
    """Liste de toutes les activités de running"""
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()
    cur.execute("""
        SELECT activity_id, start_time, distance, avg_speed 
        FROM activities 
        WHERE distance IS NOT NULL AND sport = 'running'
    """)
    data = cur.fetchall()
    conn.close()

    result = [
        {'activity_id': row[0], 'start_time': row[1], 'distance': row[2], 'avg_speed': row[3]}
        for row in data
    ]
    return jsonify(result)


@app.route('/api/activities/<int:activity_id>/records', methods=['GET'])
def get_activity_records(activity_id):
    """Tous les records d'une activité donnée"""
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()

    # Records
    cur.execute("""
        SELECT record, position_lat, position_long, distance, hr, speed  
        FROM activity_records 
        WHERE activity_id = ?
    """, (activity_id,))
    records = cur.fetchall()

    # Info activité
    cur.execute("""
        SELECT activity_id, start_time, stop_time, distance, avg_speed 
        FROM activities 
        WHERE activity_id = ?
    """, (activity_id,))
    activity_data = cur.fetchone()
    conn.close()

    result_records = [
        {'record': row[0], 'lat': row[1], 'long': row[2], 'distance': row[3], 'hr': row[4], 'speed': row[5]}
        for row in records
    ]

    if activity_data:
        result_activity = {
            'activity_id': activity_data[0],
            'start_time': activity_data[1],
            'stop_time': activity_data[2],
            'distance': activity_data[3],
            'avg_speed': activity_data[4],
            'records': result_records
        }
        return jsonify(result_activity)
    else:
        return jsonify({'error': 'Activity not found'}), 404


@app.route('/api/activities/latest', methods=['GET'])
def get_latest_activity():
    """Dernière activité de running"""
    conn = sqlite3.connect(DB_PATH_ACTIVITIES)
    cur = conn.cursor()
    cur.execute("""
        SELECT activity_id, start_time, stop_time, distance, avg_speed 
        FROM activities 
        WHERE sport = 'running' 
        ORDER BY start_time DESC 
        LIMIT 1
    """)
    data = cur.fetchone()
    conn.close()

    if data:
        result = {
            'activity_id': data[0],
            'start_time': data[1],
            'stop_time': data[2],
            'distance': data[3],
            'avg_speed': data[4]
        }
        return jsonify(result)
    else:
        return jsonify({'error': 'No running activity found'}), 404


@app.route('/api/sleep/last-week', methods=['GET'])
def get_last_week_sleep():
    """Données de sommeil des 7 derniers jours"""
    conn = sqlite3.connect(DB_PATH_GARMIN)
    cur = conn.cursor()
    cur.execute("""
        SELECT start, end, total_sleep 
        FROM sleep 
        ORDER BY start DESC 
        LIMIT 7
    """)
    data = cur.fetchall()
    conn.close()

    result = [
        {'start': row[0], 'end': row[1], 'total_sleep': row[2]}
        for row in data
    ]
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)