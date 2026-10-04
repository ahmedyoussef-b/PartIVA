'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MaterialBadge } from './material-badge'
import { PartStatusBadge } from './part-status-badge'
import type { Part } from '@/schemas/part'
import Image from 'next/image'

interface PartCardProps {
  part: Part
  onClick?: () => void
  thumbnailUrl?: string
}

export function PartCard({ part, onClick, thumbnailUrl }: PartCardProps) {
  const displayThumb = thumbnailUrl || part.files.photos[0]

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors">
          {part.reference}
        </span>
        <PartStatusBadge status={part.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="aspect-square bg-muted/60 rounded-md overflow-hidden relative border border-border/50">
          {displayThumb ? (
            <Image
              src={displayThumb}
              alt={part.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
              Aucun aperçu
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {part.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {part.description}
          </p>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <MaterialBadge material={part.material} />
          <span className="text-xs text-muted-foreground font-mono">{part.version}</span>
        </div>
      </CardContent>
    </Card>
  )
}
