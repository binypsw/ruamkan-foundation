// คัดลอก db/init/*.sql ไป web/seed/ ให้ POST /api/test/reset ใช้ (web build context คือ web/ เท่านั้น)
import { mkdirSync, copyFileSync } from 'node:fs';
mkdirSync(new URL('../seed/', import.meta.url), { recursive: true });
for (const f of ['01-schema.sql', '02-seed.sql']) {
  copyFileSync(new URL('../../db/init/' + f, import.meta.url), new URL('../seed/' + f, import.meta.url));
}
console.log('synced seed');
