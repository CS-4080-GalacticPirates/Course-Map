'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type EquivalentCoursesRequest = {
  university: string;
  courses: string[];
};

// Adjust this once you know the real API response shape
type EquivalentCoursesResponse ={};

export async function fetchEquivalentCourses(
  university: string,
  courses: string[]
): Promise<EquivalentCoursesResponse> {
  const response = await fetch('/api/get_equivalent_courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const courses = params.get('classes')?.split('|') ?? [];

  const [results, setResults] = useState<EquivalentCoursesResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!university || courses.length === 0) {
      setLoading(false);
      return;
    }

    fetchEquivalentCourses(university, courses)
      .then(setResults)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [university, courses]);

  if (loading) {
    return <p className="text-center mt-16">Loading results...</p>;
  }

  if (error) {
    return (
      <p className="text-center mt-16 text-red-600">
        Error: {error}
      </p>
    );
  }

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

      <ul className="list-disc ml-6 mb-6">
        {courses.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2">
        Equivalent Courses
      </h2>

      {results.length === 0 ? (
        <p>No equivalent courses found.</p>
      ) : (
        <ul className="list-disc ml-6">
          {results.map((course, i) => (
            <li key={i}>{course}</li>
          ))}
        </ul>
      )}
    </div>
  );
}