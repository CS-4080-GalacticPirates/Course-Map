'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type EquivalentCoursesRequest = {
  university: string;
  courses: string[];
};

type UniversityInfo = {
  name: string;
  location: string;
};

type CommunityCollegeInfo = {
  name: string;
  location: string;
};

type EquivalentEntry = {
  community_college_info: CommunityCollegeInfo;
  university_course: string;
  course_equivalent: string[];
};

type ApiResponseItem =
  | { university_info: UniversityInfo }
  | EquivalentEntry;

type EquivalentCoursesResponse = ApiResponseItem[];

export async function fetchEquivalentCourses(
  university: string,
  courses: string[]
): Promise<EquivalentCoursesResponse> {
  const response = await fetch('http://localhost:8000/api/get_equivalent_courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ university, courses } as EquivalentCoursesRequest),
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
  const selectedCourses = params.get('classes')?.split('|') ?? [];

  const [results, setResults] = useState<EquivalentCoursesResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!university || selectedCourses.length === 0) {
      setLoading(false);
      return;
    }

    fetchEquivalentCourses(university, selectedCourses)
      .then(setResults)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [university, selectedCourses]);

  /**
   * Group results by community college
   */
  const groupedByCollege = useMemo(() => {
    const map = new Map<
      string,
      {
        info: CommunityCollegeInfo;
        courses: EquivalentEntry[];
      }
    >();

    results.forEach((item) => {
      if ('community_college_info' in item) {
        const key = item.community_college_info.name;

        if (!map.has(key)) {
          map.set(key, {
            info: item.community_college_info,
            courses: [],
          });
        }

        map.get(key)!.courses.push(item);
      }
    });

    return Array.from(map.values());
  }, [results]);

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
    <div className="max-w-4xl mx-auto mt-16 p-6">
      <header className="w-full fixed top-0 left-0 h-20 border-b border-transparent z-50  bg-[#0E1219]">
        <Link href="/">
          <nav className="max-w-7xl mx-auto p-1.5 text-white text-[40px]">
            Course Map
          </nav>
        </Link>
      </header>
      <h1 className="text-2xl font-bold mb-4">Transfer Results</h1>

      <p className="mb-6">
        <strong>University:</strong> {university}
      </p>

      <h2 className="text-lg font-semibold mb-2">Selected Classes</h2>
      <ul className="list-disc ml-6 mb-8">
        {selectedCourses.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-4">Equivalent Courses</h2>

      {groupedByCollege.length === 0 ? (
        <p>No equivalent courses found.</p>
      ) : (
        <div className="space-y-6">
          {groupedByCollege.map((college) => (
            <div
              key={college.info.name}
              className="bg-white shadow rounded p-4 border"
            >
              <h3 className="text-lg font-bold mb-1">
                {college.info.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {college.info.location}
              </p>

              <div className="space-y-3">
                {college.courses.map((entry, i) => (
                  <div key={i} className="pl-3 border-l">
                    <p>
                      <strong>{entry.university_course}</strong>
                    </p>
                    <p className="text-sm text-gray-700">
                      Equivalent: {entry.course_equivalent.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
