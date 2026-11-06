import { route, ok } from '@/lib/http';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = route({ auth: true }, async ({ user }) => {
  const rows = await query<any>(
    `SELECT id, channel, kind, title, body, project_id, read, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 200`,
    [user!.id],
  );
  const items = rows.map((r) => ({
    id: r.id, channel: r.channel, kind: r.kind, title: r.title, body: r.body,
    projectId: r.project_id, read: r.read, createdAt: r.created_at.toISOString(),
  }));
  const cnt = await query<{ n: number }>('SELECT count(*) AS n FROM notifications WHERE user_id = $1 AND read = false', [user!.id]);
  return ok({ items, unread: cnt[0].n });
});
