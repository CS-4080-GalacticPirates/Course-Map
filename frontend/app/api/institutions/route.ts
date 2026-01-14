import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/db';

export async function GET() {
  const rows = db.prepare('SELECT institution_name FROM college_locations').all();

    console.log('Rows from DB:', rows);

  const names = rows.map((row: any) => row.institution_name);

  return NextResponse.json(names);
}
