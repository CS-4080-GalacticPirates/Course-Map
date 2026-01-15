# Course-Map
A web app that simplifies finding course equivalents in community colleges for CSUs and UCs


How to start API on your localhost:

uvicorn routes:app --reload (remove the --reload flag to manually restart the API)

/api/get_universities: GET

/api/get_university_courses: POST
Request Format: {"university": {university name as it appears in database}}

/api/get_equivalent_courses: POST
Request Format: {
    "university": {university name as it appears in database},
    "courses": {courses being requested as it appears in the database}
}

