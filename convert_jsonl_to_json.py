import json

input_file = "jobs.jsonl"
output_file = "static/jobs.json"

with open(input_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

jobs = [json.loads(line.strip()) for line in lines]

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(jobs, f, indent=2)

print(f"✅ Converted {len(jobs)} job entries to static/jobs.json")
