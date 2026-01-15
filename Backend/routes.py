from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import aiosqlite


# initialize API
app = FastAPI()

class UniversityCourseItem(BaseModel):
    university: str

class SearchItem(BaseModel):
    university: str
    courses: list[str]


@app.get("/api/get_universities")
async def get_universities():
    """Get all universities in the database."""
    conn = await aiosqlite.connect("assist.db")
    cursor = await conn.execute("SELECT DISTINCT receiving_institution FROM agreements")
    universities = await cursor.fetchall()
    if len(universities) == 0:
        return {"error": "No such university found."}
    universities = [uni[0] for uni in universities]
    await conn.close()
    return {
        "universities":universities
    }

@app.post("/api/get_university_courses")
async def get_university_courses(item: UniversityCourseItem):
    """Get all courses of a university that is in the database."""
    university = item.university
    conn = await aiosqlite.connect("assist.db")

    # first get agreement ids that tie to the university
    cursor = await conn.execute("SELECT id FROM agreements WHERE receiving_institution = ?", (university,))
    ids = await cursor.fetchall()
    if len(ids) == 0:
        return {"error": "No such university found."}
    ids = [id[0] for id in ids]

    # now get all courses according to ids
    placeholders = ', '.join(['?'] * len(ids))
    cursor = await conn.execute(f"SELECT receiving_course FROM articulations WHERE agreement_id IN ({placeholders})", ids)
    courses = await cursor.fetchall()
    courses = [course[0] for course in courses]
    await conn.close()
    return {
        "courses": courses
    }

@app.post("/api/get_equivalent_courses")
async def get_equivalent_courses(item: SearchItem):
    """
    Get community colleges and courses that provide credit for the given university's courses
    Returns a JSON object that maps community college courses to their host college
    and to their university course equivalent, along with information about the college like location.
    """
    courses = item.courses
    placeholders = ', '.join(['?'] * len(courses))
    conn = await aiosqlite.connect("assist.db")
    cursor = await conn.execute(f"SELECT id,agreement_id,receiving_course FROM articulations WHERE receiving_course IN ({placeholders})", courses)
    data = await cursor.fetchall()
    ids = [id[0] for id in data]
    agreement_ids = [id[1] for id in data]
    courses = [course[2] for course in data]
    # get the agreement id and get the courses
    # add to the response as one entry per course
    # first add university location to compare with all others
    university = item.university
    cursor = await conn.execute("SELECT address FROM college_locations WHERE institution_name = ?", (university,))
    location = await cursor.fetchall()
    if len(university) == 0:
        return {"error": "No such university found."}
    location = location[0][0]
    results = [{"university_info": {"name": university, "location":location}}]
    for id, agreement_id, course in list(zip(ids, agreement_ids, courses)):
        # course(s) for one uni course
        cursor = await conn.execute(f"SELECT course FROM sending_courses WHERE articulation_id = ?", (id,))
        courses = await cursor.fetchall()
        courses = [course[0] for course in courses]
        
        cursor = await conn.execute("SELECT sending_institution FROM agreements WHERE id = ?", (agreement_id,))
        college = await cursor.fetchall()
        college = college[0][0]

        # get location
        cursor = await conn.execute("SELECT address FROM college_locations WHERE institution_name = ?", (college,))
        location = await cursor.fetchall()
        location = location[0][0]

        results.append({
            "community_college_info": {"name": college, "location": location},
            "university_course": course,
            "course_equivalent": courses
        })
    await conn.close()
    return results
    










    