'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type EquivalentCoursesRequest = {
  university: string;
  courses: string[];
};

export async function fetchEquivalentCourses(
  university: string | null,
  courses: string[]
) {
  const response = await fetch("/api/get_equivalent_courses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      university,
      courses,
    } as EquivalentCoursesRequest),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch equivalent courses: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export default function ResultsPage() {
  const params = useSearchParams();

  const university = params.get('university');
  const courses = params.get('classes')?.split("|") ?? [];
  const results = await fetchEquivalentCourses(university, courses)
  


  

  return (
    <div className="max-w-3xl mx-auto mt-16 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">
        Transfer Results
      </h1>

      <p className="mb-4">
        <strong>University:</strong> {university}
      </p>

      <h2 className="text-lg font-semibold mb-2">
        Selected Classes
      </h2>

      <ul className="list-disc ml-6">
        {/* {results.map(c => (
          <li key={c}>{c}</li>
        ))} */results}
      </ul>
    </div>
  );
}
