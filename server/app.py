from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

DATABASE = os.path.join(os.path.dirname(__file__), "jobs.db")

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_fulltext_index():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Drop old FTS table if it exists (to avoid schema mismatch)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='jobs_fts';")
    if cursor.fetchone():
        cursor.execute("DROP TABLE jobs_fts;")
        conn.commit()
    # Create FTS5 virtual table with apply_link
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS jobs_fts USING fts5(
            job_title, company_name, job_location, description, source, apply_link, content='jobs', content_rowid='rowid'
        );
    """)
    # Populate FTS table
    cursor.execute("""
        INSERT INTO jobs_fts (rowid, job_title, company_name, job_location, description, source, apply_link)
        SELECT rowid, job_title, company_name, job_location, description, source, apply_link FROM jobs;
    """)
    conn.commit()
    conn.close()

# Ensure FTS index is created at startup
ensure_fulltext_index()

@app.route("/")
def home():
    return jsonify({"message": "Hirebuddy API is live!"})

@app.route("/search", methods=["GET"])
def search_jobs():
    keyword = request.args.get("role", "").strip().lower()
    if not keyword:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='jobs_fts';")
        if cursor.fetchone():
            cursor.execute("""
                SELECT job_title, company_name, job_location, apply_link,
                       COALESCE(description, '') as description,
                       source
                FROM jobs_fts
                WHERE jobs_fts MATCH ?
                LIMIT 50
            """, (keyword,))
            rows = cursor.fetchall()
            if not rows:
                cursor.execute("""
                    SELECT job_title, company_name, job_location, apply_link,
                           COALESCE(description, '') as description,
                           source
                    FROM jobs
                    WHERE LOWER(job_title) LIKE ? OR LOWER(description) LIKE ?
                    LIMIT 50
                """, (f"%{keyword}%", f"%{keyword}%"))
                rows = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT job_title, company_name, job_location, apply_link,
                       COALESCE(description, '') as description,
                       source
                FROM jobs
                WHERE LOWER(job_title) LIKE ? OR LOWER(description) LIKE ?
                LIMIT 50
            """, (f"%{keyword}%", f"%{keyword}%"))
            rows = cursor.fetchall()
    except Exception as e:
        print("Database error:", e)
        rows = []

    conn.close()
    jobs = [dict(row) for row in rows]
    return jsonify(jobs)

if __name__ == "__main__":
    app.run(debug=True, port=5000)