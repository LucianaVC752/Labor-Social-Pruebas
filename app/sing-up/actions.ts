'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

import { createClient } from '../../utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const cookieStore = await cookies()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const lockUntilStr = cookieStore.get('ls_login_lock_until')?.value
  const now = Date.now()
  if (lockUntilStr && Number(lockUntilStr) > now) {
    redirect(`/sing-up?locked=1&until=${lockUntilStr}`)
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    const attempts = Number(cookieStore.get('ls_login_attempts')?.value ?? '0')
    const nextAttempts = attempts + 1
    if (nextAttempts >= 3) {
      const until = now + 15 * 60 * 1000
      cookieStore.set('ls_login_lock_until', String(until), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      })
      cookieStore.set('ls_login_attempts', '0', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      })
      redirect(`/sing-up?locked=1&until=${until}`)
    } else {
      cookieStore.set('ls_login_attempts', String(nextAttempts), {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      })
      redirect(`/sing-up?error=1&remaining=${Math.max(0, 3 - nextAttempts)}`)
    }
  }
  // Decide post-login destination
  const redirectTo = (formData.get('redirectTo') as string) || ''
  cookieStore.set('ls_login_attempts', '0', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  })
  cookieStore.set('ls_session_started_at', String(now), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  })
  revalidatePath('/', 'layout')
  if (redirectTo) {
    redirect(redirectTo)
  }
  redirect('/dashboard')
}

