import { forbidden, notFound, ok, route, uuid } from '@/lib/http';
import { queryOne, tx } from '@/lib/db';
import { A4 } from '@/messages/a4';

export const dynamic = 'force-dynamic';

/** A-11: ต้นเรื่องยืนยันรับของ */
export const POST = route<{ id: string }>({ roles: ['starter'] }, async ({ params, user }) => {
  const id = uuid(params.id, 'รายการจอง');
  return tx(async (c) => {
    const p = await queryOne<{ starter_id: string }>(
      `SELECT pr.starter_id FROM item_pledges ip JOIN project_items i ON i.id = ip.item_id JOIN projects pr ON pr.id = i.project_id
        WHERE ip.id = $1 FOR UPDATE OF ip`,
      [id],
      c,
    );
    if (!p) throw notFound(A4.PLEDGE_NOT_FOUND);
    if (p.starter_id !== user!.id) throw forbidden(A4.NOT_OWNER);
    const row = await queryOne<any>(
      'UPDATE item_pledges SET received = true WHERE id = $1 RETURNING id, item_id AS "itemId", qty, tracking_no AS "trackingNo", received',
      [id],
      c,
    );
    return ok({ pledge: row });
  });
});
