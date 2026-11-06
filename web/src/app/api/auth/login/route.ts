import { NextResponse } from 'next/server';
import { route, AppError } from '@/lib/http';
import { A3 } from '@/messages/a3';
import { verifyLogin } from '@/lib/members';
import { loadSessionUser, makeSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const POST = route({}, async ({ body }) => {
  const email = body?.email;
  const password = body?.password;
  const fail = () => new AppError(401, 'INVALID_CREDENTIALS', A3.invalidCredentials);
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) throw fail();
  const id = await verifyLogin(email, password);
  if (!id) throw fail();
  const user = await loadSessionUser(id);
  if (!user) throw fail();
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, makeSessionToken(id), sessionCookieOptions);
  return res;
});
