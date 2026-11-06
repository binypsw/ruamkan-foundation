import { Pool, PoolClient, QueryResultRow, types } from 'pg';

// numeric -> string (ไม่แปลงเป็น float) · bigint (count) -> number
types.setTypeParser(1700, (v) => v);
types.setTypeParser(20, (v) => parseInt(v, 10));

let pool: Pool | null = null;

/** ต่อฐานข้อมูลแบบ lazy: ไม่ต่อตอน build */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ?? 'postgres://ruamkan:ruamkan_dev_pw@localhost:5433/ruamkan',
      max: 20,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    pool.on('connect', (c) => {
      c.query("SET TIME ZONE 'Asia/Bangkok'").catch(() => undefined);
    });
    pool.on('error', () => undefined);
  }
  return pool;
}

export type Q = Pick<PoolClient, 'query'>;

export async function query<T extends QueryResultRow = any>(sql: string, params: unknown[] = [], client?: Q): Promise<T[]> {
  const r = await (client ?? getPool()).query<T>(sql, params as any[]);
  return r.rows;
}

export async function queryOne<T extends QueryResultRow = any>(sql: string, params: unknown[] = [], client?: Q): Promise<T | null> {
  const rows = await query<T>(sql, params, client);
  return rows[0] ?? null;
}

/** transaction: rollback เมื่อ throw */
export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await getPool().connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch { /* ignore */ }
    throw e;
  } finally {
    c.release();
  }
}

/** คีย์เข้ารหัสข้อมูลอ่อนไหว (NFR-05) ใช้กับ pgp_sym_encrypt/decrypt */
export const DATA_KEY = () => process.env.DATA_KEY ?? 'ruamkan-dev-key';
