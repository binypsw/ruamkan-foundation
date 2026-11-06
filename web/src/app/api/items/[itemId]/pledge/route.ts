import { bad, conflict, notFound, ok, route, rule, uuid } from '@/lib/http';
import { queryOne, tx } from '@/lib/db';
import { now } from '@/lib/clock';
import { isValidQty, pledgeCheck, trackingNo } from '@/lib/rules/labor';
import { A4 } from '@/messages/a4';

export const dynamic = 'force-dynamic';

/** FR-32/33 · BR-26 · NFR-12: จองสิ่งของ ตัดยอดทันทีด้วย UPDATE แบบมีเงื่อนไขใน transaction */
export const POST = route<{ itemId: string }>({ auth: true }, async ({ params, user, body }) => {
  const itemId = uuid(params.itemId, 'รายการสิ่งของ');
  const qty = typeof body?.qty === 'string' && /^\d+$/.test(body.qty) ? parseInt(body.qty, 10) : body?.qty;
  if (!isValidQty(qty)) throw bad('VALIDATION', A4.PLEDGE_QTY_INVALID, { field: 'qty' });

  return tx(async (c) => {
    const meta = await queryOne<{ name: string; project_id: string; title: string; status: string }>(
      `SELECT i.name, i.project_id, p.title, p.status FROM project_items i JOIN projects p ON p.id = i.project_id WHERE i.id = $1`,
      [itemId],
      c,
    );
    if (!meta) throw notFound(A4.ITEM_NOT_FOUND);
    if (meta.status !== 'active') throw rule('PROJECT_NOT_ACTIVE', A4.PROJECT_NOT_ACTIVE);

    const upd = await queryOne<{ qty_reserved: number; qty_needed: number }>(
      `UPDATE project_items SET qty_reserved = qty_reserved + $2
        WHERE id = $1 AND qty_reserved + $2 <= qty_needed
        RETURNING qty_reserved, qty_needed`,
      [itemId, qty],
      c,
    );
    if (!upd) {
      const cur = await queryOne<{ qty_reserved: number; qty_needed: number }>('SELECT qty_reserved, qty_needed FROM project_items WHERE id = $1', [itemId], c);
      const remaining = cur ? cur.qty_needed - cur.qty_reserved : 0;
      const verdict = pledgeCheck(qty, remaining);
      if (verdict === 'exceed') throw rule('BR_26_EXCEED', A4.PLEDGE_EXCEED, { remaining });
      throw conflict('BR_26_ITEM_FULL', A4.PLEDGE_FULL, { remaining });
    }

    const at = await now(c);
    const row = await queryOne<{ id: string }>(
      `INSERT INTO item_pledges (item_id, donor_id, qty, tracking_no, created_at)
       VALUES ($1,$2,$3,'-',$4) RETURNING id`,
      [itemId, user!.id, qty, at],
      c,
    );
    const tracking = trackingNo(row!.id);
    await queryOne('UPDATE item_pledges SET tracking_no = $2 WHERE id = $1', [row!.id, tracking], c);

    return ok(
      {
        pledge: { id: row!.id, qty, trackingNo: tracking },
        label: {
          trackingNo: tracking,
          itemName: meta.name,
          qty,
          projectTitle: meta.title,
          recipient: A4.RECIPIENT,
          note: A4.PLEDGE_NOTE,
        },
        remaining: upd.qty_needed - upd.qty_reserved,
      },
      201,
    );
  });
});
