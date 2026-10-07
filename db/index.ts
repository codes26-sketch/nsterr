import { drizzle } from 'drizzle-orm/netlify-db';
import { getDatabase } from '@netlify/database';
import * as schema from './schema.ts';

export function getDb() {
  return drizzle({ client: getDatabase(), schema });
}
