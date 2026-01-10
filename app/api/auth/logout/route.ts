import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
  
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return NextResponse.json({ message: 'Выход выполнен успешно' })
}

