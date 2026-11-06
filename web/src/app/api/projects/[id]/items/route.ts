import { ok, route, notFound } from '@/lib/http';
import { query, queryOne } from '@/lib/db';
import { resolveProjectId } from '@/lib/resolve';

export const dynamic = 'force-dynamic';

/** FR-15: ต้องการ / จองแล้ว / ยังขาด */
export const GET = route<{ id: string }>({}, async ({ params, user }) => {
  const pid = await resolveProjectId(params.id);
  const p = await queryOne<{ status: string; starter_id: string }>('SELECT status, starter_id FROM projects WHERE id = $1', [pid]);
  if (!p) throw notFound('ไม่พบโครงการ');
  if ((p.status === 'pending' || p.status === 'rejected') && !(user && (user.role === 'staff' || user.id === p.starter_id))) {
    throw notFound('ไม่พบโครงการ');
  }
  const rows = await query<{ id: string; name: string; qty_needed: number; qty_reserved: number }>(
    'SELECT id, name, qty_needed, qty_reserved FROM project_items WHERE project_id = $1 ORDER BY name, id',
    [pid],
  );
  return ok({
    items: rows.map((r) => ({ id: r.id, name: r.name, needed: r.qty_needed, reserved: r.qty_reserved, remaining: r.qty_needed - r.qty_reserved })),
  });
});
