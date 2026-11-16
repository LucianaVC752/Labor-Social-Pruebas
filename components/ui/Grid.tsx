"use client"
import React from 'react'

export type GridProps = {
  cols?: number
  gap?: string
  className?: string
  children: React.ReactNode
}

// Flexible Grid component using CSS Grid with Tailwind classes.
export const Grid = React.memo(function Grid({ cols = 4, gap = 'gap-4', className = '', children }: GridProps) {
  // Tailwind-safe mapping to avoid dynamic class generation issues.
  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }
  const colClass = gridColsMap[cols] || 'grid-cols-4'
  return (
    <div className={`grid ${colClass} ${gap} ${className}`}>
      {children}
    </div>
  )
})

export default Grid