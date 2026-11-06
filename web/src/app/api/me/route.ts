import { route, ok } from '@/lib/http';
import { tx } from '@/lib/db';
import { notify } from '@/lib/notify';
import { A3 } from '@/messages/a3';
import { parsePatchMe } from '@/lib/rules/members';
import { updateProfile } from '@/lib/members';
import { loadSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = route({}, async ({ user }) => ok({ user }));

export const PATCH = route({ auth: true }, async ({ user, body }) => {
  const patch = parsePatchMe(body);
  await tx(async (c) => {
    const { wasLineLinked } = await updateProfile(user!.id, patch, c);
    // FR-45: เชื่อม LINE ครั้งแรก -> ส่งข้อความต้อนรับ (จำลอง)
    if (patch.lineLinked === true && !wasLineLinked) {
      await notify(c, user!.id, { kind: 'line_linked', title: A3.lineLinkedTitle, body: A3.lineLinkedBody });
    }
  });
  return ok({ user: await loadSessionUser(user!.id) });
});
