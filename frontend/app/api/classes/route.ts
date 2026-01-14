import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/db';

export async function GET() {
  const rows = db.prepare('SELECT receiving_course FROM articulations').all();

    console.log('Rows from DB:', rows);

  const names = rows.map((row: any) => row.articulations);

  return NextResponse.json(names);
}
