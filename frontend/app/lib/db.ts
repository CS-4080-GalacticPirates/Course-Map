// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

// path to backend folder outside frontend
const dbPath = path.join(__dirname, '../../../backend/assist.db');

console.log('Opening DB at:', dbPath);

export const db = new Database(dbPath, { readonly: true });
