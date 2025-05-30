import json
import sqlite3

# Read from jobs.jsonl
with open("jobs.jsonl", "r", encoding="utf-8") as f:
    lines = f.readlines()
    jobs = [json.loads(line.strip()) for line in lines]

# Connect to SQLite
conn = sqlite3.connect("jobs.db")
cursor = conn.cursor()

# Create table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT,
        company_name TEXT,
        job_location TEXT,
        apply_link TEXT,
        description TEXT,
        source TEXT
    )
''')

# Clear existing records (optional)
cursor.execute('DELETE FROM jobs')

# Insert jobs
for job in jobs:
    cursor.execute('''
        INSERT INTO jobs (job_title, company_name, job_location, apply_link, description, source)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        job.get("job_title", ""),
        job.get("company_name", ""),
        job.get("job_location", ""),
        job.get("apply_link", ""),
        job.get("description", ""),
        job.get("source", "")
    ))

conn.commit()
conn.close()
print(f"✅ Loaded {len(jobs)} jobs into the database.")

