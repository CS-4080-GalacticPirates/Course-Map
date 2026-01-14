"""
Location Data Manager
Stores and manages location data for colleges in assist.db
"""

import sqlite3
import csv
import os


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(SCRIPT_DIR, "assist.db")

# Location data for California colleges
COLLEGE_LOCATIONS = {
    # Community Colleges
    "East Los Angeles College": {
        "city": "Monterey Park",
        "state": "CA",
        "zip_code": "91754",
        "latitude": 34.0164,
        "longitude": -118.1216,
        "address": "1301 Avenida Cesar Chavez",
        "type": "community_college",
    },
    "Mount San Antonio College": {
        "city": "Walnut",
        "state": "CA",
        "zip_code": "91789",
        "latitude": 34.0469,
        "longitude": -117.8434,
        "address": "1100 N Grand Ave",
        "type": "community_college",
    },
    "Los Angeles City College": {
        "city": "Los Angeles",
        "state": "CA",
        "zip_code": "90029",
        "latitude": 34.0906,
        "longitude": -118.2894,
        "address": "855 N Vermont Ave",
        "type": "community_college",
    },
    "Santa Monica College": {
        "city": "Santa Monica",
        "state": "CA",
        "zip_code": "90405",
        "latitude": 34.0156,
        "longitude": -118.4696,
        "address": "1900 Pico Blvd",
        "type": "community_college",
    },
    "Pasadena City College": {
        "city": "Pasadena",
        "state": "CA",
        "zip_code": "91106",
        "latitude": 34.1416,
        "longitude": -118.1286,
        "address": "1570 E Colorado Blvd",
        "type": "community_college",
    },
    # Universities (CSU)
    "California Polytechnic University, Pomona": {
        "city": "Pomona",
        "state": "CA",
        "zip_code": "91768",
        "latitude": 34.0565,
        "longitude": -117.8214,
        "address": "3801 W Temple Ave",
        "type": "university",
    },
    # Universities (UC)
    "University of California, Los Angeles": {
        "city": "Los Angeles",
        "state": "CA",
        "zip_code": "90095",
        "latitude": 34.0689,
        "longitude": -118.4452,
        "address": "405 Hilgard Ave",
        "type": "university",
    },
}


def setup_location_table():
    """Create location table in database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.executescript(
        """
        CREATE TABLE IF NOT EXISTS college_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            institution_name TEXT UNIQUE,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            latitude REAL,
            longitude REAL,
            address TEXT,
            institution_type TEXT
        );
    """
    )

    conn.commit()
    conn.close()


def populate_locations():
    """Populate location data from the dictionary"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    for institution, data in COLLEGE_LOCATIONS.items():
        cursor.execute(
            """
            INSERT OR REPLACE INTO college_locations 
            (institution_name, city, state, zip_code, latitude, longitude, address, institution_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                institution,
                data["city"],
                data["state"],
                data["zip_code"],
                data["latitude"],
                data["longitude"],
                data["address"],
                data["type"],
            ),
        )

    conn.commit()
    conn.close()


def export_to_csv(filename="location_data.csv"):
    """Export location data to CSV"""
    filepath = os.path.join(SCRIPT_DIR, filename)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT institution_name, institution_type, address, city, state, zip_code, latitude, longitude
        FROM college_locations
        ORDER BY institution_type, institution_name
    """
    )

    rows = cursor.fetchall()

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "Institution Name",
                "Type",
                "Address",
                "City",
                "State",
                "Zip Code",
                "Latitude",
                "Longitude",
            ]
        )
        writer.writerows(rows)

    conn.close()
    print(f"Exported {len(rows)} records to {filename}")


def main():
    setup_location_table()
    populate_locations()
    export_to_csv()


if __name__ == "__main__":
    main()
