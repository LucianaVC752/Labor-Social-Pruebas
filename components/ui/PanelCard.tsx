"use client"
import React from 'react'

export type PanelCardProps = {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

// Professional panel card styled for admin/municipal dashboards.
export const PanelCard = React.memo(function PanelCard({ title, subtitle, icon, children }: PanelCardProps) {
  return (
    <section className="rounded-lg border bg-white/80 shadow-sm p-4">
      <header className="flex items-center gap-3 mb-3">
        {icon && <div className="text-blue-600" aria-hidden>{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      </header>
      <div className="text-sm text-neutral-800 min-h-16">
        {children}
      </div>
    </section>
  )
})

export default PanelCard