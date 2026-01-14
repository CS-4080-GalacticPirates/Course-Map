'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';

export default function TransferForm() {
  const [uniQuery, setUniQuery] = useState('');
  const [universities, setUniversities] = useState<string[]>([]);
  const [selectedUni, setSelectedUni] = useState<string | null>(null);

  const [classQuery, setClassQuery] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string | null>(null);
  const [classValue, setClassValue] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/institutions')
      .then(res => res.json())
      .then(data => setUniversities(data));
  }, []);

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => setClasses(data));
  }, []);

  const filteredUniversities =
    uniQuery === ''
      ? universities
      : universities.filter(u =>
          u.toLowerCase().includes(uniQuery.toLowerCase())
        );

  const filteredClasses =
  classQuery === ''
    ? classes.filter((c): c is string => typeof c === 'string')
    : classes.filter(
        (c): c is string =>
          typeof c === 'string' &&
          c.toLowerCase().includes(classQuery.toLowerCase())
      );


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      university: selectedUni,
      classes: selectedClasses,
    });
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
            onChange={e => setUniQuery(e.target.value)}
          />
          <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded bg-white border shadow">
            {filteredUniversities.map(uni => (
              <Combobox.Option
                key={uni}
                value={uni}
                className={({ active }) =>
                  `cursor-pointer p-2 ${active ? 'bg-blue-500 text-white' : ''}`
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

        <Combobox value={selectedClasses} onChange={setSelectedClasses}>
        <div className="relative">
            <Combobox.Input
            className="w-full border p-2 rounded"
            placeholder="Search classes..."
            onChange={(e) => setClassQuery(e.target.value)}
            displayValue={(value: string) => value}
            />

            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded bg-white border shadow">
            {filteredClasses.map(course => (
                <Combobox.Option
                key={course}
                value={course}
                className={({ active }) =>
                    `cursor-pointer p-2 ${active ? 'bg-blue-500 text-white' : ''}`
                }
                >
                {course}
                </Combobox.Option>
            ))}
            </Combobox.Options>
        </div>
        </Combobox>


      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        Search
      </button>
    </form>
  );
}
