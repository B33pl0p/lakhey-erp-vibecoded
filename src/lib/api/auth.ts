'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient, createSessionClient } from '@/lib/appwrite/server';

export async function loginAction(email: string, password: string): Promise<{ error?: string }> {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();
    cookieStore.set('appwrite-session', session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid credentials';
    return { error: message };
  }

  redirect('/');
}

export async function logoutAction() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession('current');
  } catch {
    // Session may already be invalid; still clear the cookie
  }

  const cookieStore = await cookies();
  cookieStore.delete('appwrite-session');

  redirect('/login');
}

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}
