"use client"
import { useFormStatus } from 'react-dom'

export default function LoginSubmit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={pending}>
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  )
}