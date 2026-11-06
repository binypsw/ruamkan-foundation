import { route, ok } from '@/lib/http';
import { query } from '@/lib/db';
import { isUuid } from '@/lib/members';

export const dynamic = 'force-dynamic';

export const POST = route({ auth: true }, async ({ user, body }) => {
  const ids: unknown = body?.ids;
  if (Array.isArray(ids)) {
    const valid = ids.filter(isUuid);
    if (valid.length) await query('UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2::uuid[])', [user!.id, valid]);
  } else {
    await query('UPDATE notifications SET read = true WHERE user_id = $1', [user!.id]);
  }
  return ok({ ok: true });
});
