from fastapi import FastAPI, HTTPException
from pydantic import BaseModel



# initialize API
app = FastAPI()

class SearchItem(BaseModel):
    university: str
    courses: list[str]

class LocationItem(BaseModel):
    college: str


@app.post("/get_courses")
async def get_courses(item: SearchItem):
    """
    Get courses that provide credit for the given university's courses
    Returns a JSON object that maps community college courses to their host college
    and to their university course equivalent.
    """
    pass

@app.post("/get_location")
async def get_location(item: LocationItem):
    """
    Get the geographical location of a college.
    Returns a JSON object of the location information.
    """
    pass