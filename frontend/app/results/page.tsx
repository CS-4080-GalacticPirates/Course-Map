'use client';

import { useSearchParams } from 'next/navigation';

export default function ResultsPage() {
  const params = useSearchParams();

  const university = params.get('university');
  const classes =
    params.get('classes')?.split(',') ?? [];

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
        {classes.map(c => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
