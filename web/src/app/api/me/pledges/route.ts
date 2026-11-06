import { ok, route } from '@/lib/http';
import { query } from '@/lib/db';
import { A4 } from '@/messages/a4';

export const dynamic = 'force-dynamic';

export const GET = route({ auth: true }, async ({ user }) => {
  const rows = await query<any>(
    `SELECT ip.id, ip.qty, ip.tracking_no, ip.received, ip.created_at, i.name AS item_name, p.id AS project_id, p.code, p.title
       FROM item_pledges ip JOIN project_items i ON i.id = ip.item_id JOIN projects p ON p.id = i.project_id
      WHERE ip.donor_id = $1 ORDER BY ip.created_at DESC, ip.id`,
    [user!.id],
  );
  return ok({
    pledges: rows.map((r) => ({
      id: r.id,
      qty: r.qty,
      trackingNo: r.tracking_no,
      received: r.received,
      createdAt: new Date(r.created_at).toISOString(),
      itemName: r.item_name,
      project: { id: r.project_id, code: r.code, title: r.title },
      label: {
        trackingNo: r.tracking_no,
        itemName: r.item_name,
        qty: r.qty,
        projectTitle: r.title,
        recipient: A4.RECIPIENT,
        note: A4.PLEDGE_NOTE,
      },
    })),
  });
});
