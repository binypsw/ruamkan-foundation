import { route, ok } from '@/lib/http';
import { tx } from '@/lib/db';
import { now } from '@/lib/clock';
import { notify } from '@/lib/notify';
import { assertFaceScan, normalizeIdCard } from '@/lib/rules/members';
import { getKyc, saveKyc } from '@/lib/members';

export const dynamic = 'force-dynamic';

export const GET = route({ auth: true }, async ({ user }) => ok(await getKyc(user!.id)));

export const POST = route({ auth: true }, async ({ user, body }) => {
  // FR-03: ผ่านแล้วไม่ต้องยืนยันซ้ำ
  if (user!.kycVerified) return ok({ verified: true, alreadyVerified: true });
  const idCard = normalizeIdCard(body?.idCard);
  assertFaceScan(body?.faceScannedBy); // BR-31: สแกนหน้าแทนไม่ได้
  const assistedBy = typeof body?.assistedBy === 'string' && body.assistedBy.trim() ? body.assistedBy.trim().slice(0, 200) : null;
  await tx(async (c) => {
    await saveKyc(user!.id, idCard, assistedBy, await now(c), c);
    await notify(c, user!.id, {
      kind: 'kyc_verified',
      title: 'ยืนยันตัวตนสำเร็จ',
      body: 'คุณผ่านการยืนยันตัวตน (e-KYC) แล้ว ไม่ต้องยืนยันซ้ำเมื่อตั้งโครงการถัดไป',
      channel: 'system',
    });
  });
  return ok({ verified: true });
});
