// import { neon } from '@neondatabase/serverless';
// export const executeSql = neon(process.env.DATABASE_URL!);


//  ✅ Runs only when called
import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = neon(url);
  }
  return _sql;
}
