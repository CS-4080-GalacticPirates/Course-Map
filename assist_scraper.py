"""
Assist.org Scraper
Scrapes course articulation data and saves to SQLite database
"""

import sqlite3
import requests
import json
import time
import csv
import os


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "assist.db")


def setup_database():
    """Create database tables"""
    print("Setting up database...")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS agreements (
            id TEXT PRIMARY KEY,
            year INTEGER,
            sending_institution TEXT,
            receiving_institution TEXT
        );
        
        CREATE TABLE IF NOT EXISTS articulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agreement_id TEXT,
            receiving_course TEXT,
            logic TEXT,
            FOREIGN KEY (agreement_id) REFERENCES agreements(id),
            UNIQUE(agreement_id, receiving_course)
        );
        
        CREATE TABLE IF NOT EXISTS sending_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agreement_id TEXT,
            course TEXT,
            FOREIGN KEY (agreement_id) REFERENCES agreements(id),
            UNIQUE(agreement_id, course)
        );
    """
    )

    conn.commit()
    conn.close()
    print("Database created\n")


def fetch_data(key):
    """Fetch data from Assist.org API"""
    print(f"Fetching data for key: {key}")

    url = "https://assist.org/api/articulation/Agreements"
    params = {"Key": key}
    headers = {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://assist.org/transfer/results",
    }

    try:
        response = requests.get(url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()

        with open("api_response.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        print("Data fetched successfully\n")
        return data

    except Exception as e:
        print(f"Error: {e}\n")
        return None


def save_data(key, data):
    """Parse JSON and save to database"""
    print("Parsing and saving data...")

    if not data.get("isSuccessful"):
        print("API returned unsuccessful response")
        return 0

    result = data.get("result", {})

    # Extract institution info
    sending_json = json.loads(result.get("sendingInstitution", "{}"))
    receiving_json = json.loads(result.get("receivingInstitution", "{}"))
    sending_name = sending_json.get("names", [{}])[0].get("name", "Unknown CC")
    receiving_name = receiving_json.get("names", [{}])[0].get(
        "name", "Unknown University"
    )

    # Extract year
    year_json = json.loads(result.get("academicYear", "{}"))
    year_code = year_json.get("code", "Unknown")
    year = year_code.split("-")[0] if "-" in year_code else year_code

    print(f"  {sending_name}")
    print(f"  -> {receiving_name}")
    print(f"  Year: {year}\n")

    # Create agreement ID
    agreement_id = key.replace("/", "_")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Check if already exists
    cursor.execute("SELECT id FROM agreements WHERE id = ?", (agreement_id,))
    if cursor.fetchone():
        print("Agreement already exists in database - skipping\n")
        conn.close()
        return 0

    # Save agreement
    cursor.execute(
        "INSERT INTO agreements (id, year, sending_institution, receiving_institution) VALUES (?, ?, ?, ?)",
        (agreement_id, year, sending_name, receiving_name),
    )

    # Parse articulations
    articulations_json = json.loads(result.get("articulations", "[]"))
    count = 0

    for art in articulations_json:
        try:
            articulation_data = art.get("articulation", {})

            # Get receiving course (university)
            if articulation_data.get("type") == "Course":
                course_data = articulation_data.get("course", {})
                receiving_course = f"{course_data.get('prefix', '')} {course_data.get('courseNumber', '')} - {course_data.get('courseTitle', '')}".strip()
            elif articulation_data.get("type") == "Series":
                series_data = articulation_data.get("series", {})
                series_name = series_data.get("name", "")
                courses = series_data.get("courses", [])
                titles = [c.get("courseTitle", "") for c in courses]
                receiving_course = f"{series_name} - {', '.join(titles)}".strip(" -")
            else:
                continue

            # Get sending courses (CC)
            sending_articulation = articulation_data.get("sendingArticulation", {})
            items = sending_articulation.get("items", [])
            if not items:
                continue

            # Determine logic
            conjunctions = sending_articulation.get("courseGroupConjunctions", [])
            if conjunctions:
                logic = conjunctions[0].get("groupConjunction", "UNKNOWN").upper()
            elif len(items) > 1:
                logic = "OR"  # OR = multiple options
            else:
                logic = "SINGLE"  # SINGLE = single course
            # Save articulation
            try:
                cursor.execute(
                    "INSERT INTO articulations (agreement_id, receiving_course, logic) VALUES (?, ?, ?)",
                    (agreement_id, receiving_course, logic),
                )

                # Save sending courses
                for item_group in items:
                    for course in item_group.get("items", []):
                        if course.get("type") == "Course":
                            cc_course = f"{course.get('prefix', '')} {course.get('courseNumber', '')} - {course.get('courseTitle', '')}".strip()
                            try:
                                cursor.execute(
                                    "INSERT INTO sending_courses (agreement_id, course) VALUES (?, ?)",
                                    (agreement_id, cc_course),
                                )
                            except sqlite3.IntegrityError:
                                pass

                count += 1
            except sqlite3.IntegrityError:
                pass

        except Exception as e:
            continue

    conn.commit()
    conn.close()

    print(f"Saved {count} articulations\n")
    return count


def show_results():
    """Display database summary"""
    print("=" * 70)
    print("DATABASE SUMMARY")
    print("=" * 70)

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM agreements")
    agreements = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM articulations")
    articulations = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM sending_courses")
    courses = cursor.fetchone()[0]

    print(f"\nAgreements:      {agreements}")
    print(f"Articulations:   {articulations}")
    print(f"Sending Courses: {courses}\n")

    conn.close()
    print("=" * 70 + "\n")


def export_to_csv(filename="articulations.csv"):
    """Export to CSV"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    query = """
        SELECT 
            ag.receiving_institution,
            ag.sending_institution,
            ag.year,
            art.receiving_course,
            sc.course,
            art.logic
        FROM agreements ag
        JOIN articulations art ON ag.id = art.agreement_id
        LEFT JOIN sending_courses sc ON ag.id = sc.agreement_id
        ORDER BY ag.sending_institution, art.receiving_course
    """

    cursor.execute(query)
    rows = cursor.fetchall()

    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "University",
                "Community College",
                "Year",
                "University Course",
                "CC Course",
                "Logic",
            ]
        )
        writer.writerows(rows)

    print(f"Exported {len(rows)} rows to {filename}\n")
    conn.close()


def scrape_multiple(keys):
    """Scrape multiple agreements"""
    total = 0

    for i, key in enumerate(keys, 1):
        print(f"[{i}/{len(keys)}] Processing agreement...")
        print("-" * 70)

        data = fetch_data(key)
        if data:
            count = save_data(key, data)
            total += count

        if i < len(keys):
            print("Waiting 3 seconds before next request...\n")
            time.sleep(3)

    print(f"{'='*70}")
    print(f"TOTAL: Scraped {total} new articulations")
    print(f"{'='*70}\n")


def main():
    """Main function - add agreement keys here"""
    setup_database()

    # Add keys from assist.org URLs here
    keys_to_scrape = [
        "76/118/to/75/Major/91d48af8-3aad-4422-6625-08dd783dfd80",  # East LA -> Cal Poly Pomona
        "76/62/to/75/Major/91d48af8-3aad-4422-6625-08dd783dfd80",  # Mt. SAC -> Cal Poly Pomona
        "76/49/to/75/Major/91d48af8-3aad-4422-6625-08dd783dfd80",  # Pasadena City College -> Cal Poly Pomona
        "76/3/to/75/Major/91d48af8-3aad-4422-6625-08dd783dfd80",  # Los Angeles City College-> Cal Poly Pomona
        "76/137/to/75/Major/91d48af8-3aad-4422-6625-08dd783dfd80",  # Santa Monica College -> Cal Poly Pomona
        "76/118/to/117/Major/3fc7b07d-4058-4a0a-1f72-08ddcb96df9e",  # East LA -> UCLA
        "76/62/to/117/Major/3fc7b07d-4058-4a0a-1f72-08ddcb96df9e",  # Mt. SAC -> UCLA
        "76/49/to/117/Major/3fc7b07d-4058-4a0a-1f72-08ddcb96df9e",  # Pasadena City College -> UCLA
        "76/3/to/117/Major/3fc7b07d-4058-4a0a-1f72-08ddcb96df9e",  # Los Angeles City College -> UCLA
        "76/137/to/117/Major/3fc7b07d-4058-4a0a-1f72-08ddcb96df9e",  # Santa Monica College -> UCLA
    ]

    scrape_multiple(keys_to_scrape)

    # Add location data
    import geolocation

    geolocation.main()

    show_results()
    export_to_csv("articulations.csv")

    print("Done!")
    print("\nFiles created:")
    print("  - assist.db (SQLite database)")
    print("  - articulations.csv (CSV export)")
    print("  - location_data.csv (location export)")
    print("  - api_response.json (raw API data)")


if __name__ == "__main__":
    main()
