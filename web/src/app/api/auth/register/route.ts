import { NextResponse } from 'next/server';
import { route, conflict } from '@/lib/http';
import { A3 } from '@/messages/a3';
import { parseRegister } from '@/lib/rules/members';
import { createUser, emailExists } from '@/lib/members';
import { loadSessionUser, makeSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const POST = route({}, async ({ body }) => {
  const input = parseRegister(body);
  if (await emailExists(input.email)) throw conflict('EMAIL_TAKEN', A3.emailTaken);
  let id: string;
  try {
    id = await createUser(input);
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw conflict('EMAIL_TAKEN', A3.emailTaken);
    throw e;
  }
  const user = await loadSessionUser(id);
  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, makeSessionToken(id), sessionCookieOptions);
  return res;
});
