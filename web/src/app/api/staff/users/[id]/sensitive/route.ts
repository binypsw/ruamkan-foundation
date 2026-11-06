import { route, ok } from '@/lib/http';
import { getSensitive } from '@/lib/members';

export const dynamic = 'force-dynamic';

/** FR-61: ถอดรหัสได้เฉพาะ staff/finance (บทบาทอื่น 403 โดย route()) */
export const GET = route<{ id: string }>({ roles: ['staff', 'finance'] }, async ({ params }) => ok(await getSensitive(params.id)));
