import { neon } from '@neondatabase/serverless';

export const executeSql = neon(process.env.DATABASE_URL!);
