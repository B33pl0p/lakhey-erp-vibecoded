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
    cookieStore.set('admin-session', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    cookieStore.delete('customer-session');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid credentials';
    return { error: message };
  }

  redirect('/admin');
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
  cookieStore.delete('admin-session');
  cookieStore.delete('customer-session');

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
