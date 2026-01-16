'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';
import { useRouter } from 'next/navigation';

export default function TransferForm() {
  const [uniQuery, setUniQuery] = useState('');
  const [universities, setUniversities] = useState<string[]>([]);
  const [selectedUni, setSelectedUni] = useState<string | null>(null);
  const router = useRouter();

  const [classQuery, setClassQuery] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/get_universities');
        const data = await res.json();

        if (data.error) {
          console.error('Backend error:', data.error);
          setUniversities([]);
          return;
        }

        setUniversities(data.universities);
      } catch (err) {
        console.error('Fetch failed:', err);
        setUniversities([]);
      }
    };

    fetchUniversities();
  }, []);

  useEffect(() => {
    if (!selectedUni) return;

    const fetchCourses = async () => {
      try {
        const res = await fetch(
          'http://localhost:8000/api/get_university_courses_specific',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              university: selectedUni,
            }),
          }
        );

        const data = await res.json();

        if (data.error) {
          console.error('Backend error:', data.error);
          setClasses([]);
          return;
        }

        setClasses(data.courses);
      } catch (err) {
        console.error('Fetch failed:', err);
        setClasses([]);
      }
    };

    setSelectedClasses([]);
    setClassQuery('');
    setClasses([]);

    fetchCourses();
  }, [selectedUni]);

  const filteredUniversities =
    uniQuery === ''
      ? universities
      : universities.filter(u =>
          u.toLowerCase().includes(uniQuery.toLowerCase())
        );

  const filteredClasses =
    classQuery === ''
      ? classes
      : classes.filter(c =>
          c.toLowerCase().includes(classQuery.toLowerCase())
        );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    router.push(
      `/results?university=${encodeURIComponent(selectedUni!)}&classes=${encodeURIComponent(
        selectedClasses.join('|')
      )}`
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-md mx-auto mt-16 space-y-6"
    >
      <h2 className="text-lg font-semibold">
        What University would you like to transfer to?
      </h2>

      <Combobox value={selectedUni} onChange={setSelectedUni}>
        <div className="relative">
          <Combobox.Input
            className="w-full border p-2 rounded"
            placeholder="Search university..."
            displayValue={(value: string) => value}
            onChange={(e) => setUniQuery(e.target.value)}
          />

          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded bg-white border shadow">
            {filteredUniversities.map(uni => (
              <Combobox.Option
                key={uni}
                value={uni}
                className={({ active }) =>
                  `cursor-pointer p-2 ${
                    active ? 'bg-blue-500 text-white' : ''
                  }`
                }
              >
                {uni}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </div>
      </Combobox>

      <h2 className="text-lg font-semibold">
        What class would you like to transfer?
      </h2>

      <Combobox
        value={selectedClasses}
        onChange={setSelectedClasses}
        multiple
        disabled={!selectedUni}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full border p-2 rounded disabled:bg-gray-100"
            placeholder={
              selectedUni
                ? 'Search classes...'
                : 'Select a university first'
            }
            displayValue={(values: string[]) => values.join(', ')}
            onChange={(e) => setClassQuery(e.target.value)}
          />

          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded bg-white border shadow">
            {filteredClasses.map(course => (
              <Combobox.Option
                key={course}
                value={course}
                className={({ active }) =>
                  `cursor-pointer p-2 flex justify-between ${
                    active ? 'bg-blue-500 text-white' : ''
                  } ${
                    selectedClasses.includes(course) ? 'font-medium' : ''
                  }`
                }
              >
                <span>{course}</span>
                {selectedClasses.includes(course) && <span>✓</span>}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </div>
      </Combobox>

      {selectedClasses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedClasses.map(course => (
            <span
              key={course}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm cursor-pointer"
              onClick={() =>
                setSelectedClasses(prev =>
                  prev.filter(c => c !== course)
                )
              }
            >
              {course} ✕
            </span>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedUni || selectedClasses.length === 0}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        Search
      </button>
    </form>
  );
}
