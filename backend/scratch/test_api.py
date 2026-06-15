import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

# 1. Register a test user
print("Registering user...")
res = requests.post(f"{BASE_URL}/auth/register", json={
    "name": "Test User",
    "email": "test3@example.com",
    "password": "password123"
})
if res.status_code in [200, 201]:
    token = res.json()["access_token"]
else:
    # Just login
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": "test3@example.com", "password": "password123"})
    token = res.json()["access_token"]

headers = {"Authorization": f"Bearer {token}"}
print("Login successful.")

# 3. Create a Group
print("Creating group...")
res = requests.post(f"{BASE_URL}/groups/", headers=headers, json={"name": "Test Group"})
if res.status_code in [200, 201]:
    group_id = res.json()["id"]
else:
    print("Failed to create group:", res.status_code, res.text)
    sys.exit(1)
print(f"Group created with ID: {group_id}")

# 4. Add members to group
members = ["Aisha", "Rohan", "Priya", "Meera", "Dev", "Sam"]
for m in members:
    # First register them so they exist
    requests.post(f"{BASE_URL}/auth/register", json={"name": m, "email": f"{m.lower()}@example.com", "password": "pass"})
    # Get user by email (we don't have an endpoint for this, wait, add_member uses user_id)
    # Actually, the user object might be returned or we can just try to add by ID. 
    # For now, let's just skip adding members to see how anomalies respond to UNKNOWN_PARTICIPANT.

# 5. Upload CSV
print("Uploading CSV...")
with open("../expenses_export.csv", "rb") as f:
    files = {"file": ("expenses_export.csv", f, "text/csv")}
    data = {"group_id": group_id}
    res = requests.post(f"{BASE_URL}/import", headers=headers, files=files, data=data)

print(f"Import response status: {res.status_code}")
if res.status_code == 200:
    report = res.json()
    print(f"Import Run ID: {report['run_id']}")
    print(f"Total rows: {report['total_rows']}")
    print(f"Imported: {report['imported']}")
    print(f"Flagged: {report['flagged']}")
    print(f"Anomalies found: {len(report['anomalies'])}")
    
    # Save the report for viewing
    with open("report_out.json", "w") as out:
        json.dump(report, out, indent=2)
    print("Report saved to report_out.json")
else:
    print("Import failed:", res.text)
