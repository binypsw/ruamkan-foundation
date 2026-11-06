import { route, ok } from '@/lib/http';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = route({ roles: ['staff', 'finance'] }, async () => {
  const rows = await query<any>(
    `SELECT u.id, u.code, u.email, u.role, u.display_name, COALESCE(k.face_verified, false) AS kyc
       FROM users u LEFT JOIN kyc_records k ON k.user_id = u.id ORDER BY u.code NULLS LAST, u.created_at`,
  );
  return ok({
    users: rows.map((r) => ({ id: r.id, code: r.code, email: r.email, role: r.role, displayName: r.display_name, kycVerified: r.kyc })),
  });
});
