import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'

import { signOut } from '@/app/logout/actions'

export default async function Header() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const isLogged = !!data.user

  return (
    <nav className="w-full border-b bg-primary backdrop-blur">
      <div className="max-w-6xl mx-auto px-3 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/uploads/escudo.png" alt="Escudo de San Carlos" width={45} height={45} />
          <Link href="/" className="text-xl md:text-2xl font-bold text-primary-foreground">Labor Social</Link>
        </div>
        <div className="flex items-center gap-8 text-base md:text font-semibold">
          <Link href="/" className="text-primary-foreground ">Inicio</Link>
          <Link href="/dashboard" className="text-primary-foreground ">Panel</Link>
          {!isLogged ? (
            <Link href="/sing-up" className="text-primary-foreground ">Login</Link>
          ) : (
            <form action={signOut}>
              <button type="submit" className="text-primary-foreground font-semibold hover:underline bg-transparent border-none cursor-pointer">
                Salir
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  )
}
