'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MaterialBadge } from './material-badge';
import { PartStatusBadge } from './part-status-badge';
import type { Part } from '@/schemas/part';
import Image from 'next/image';

interface PartCardProps {
  part: Part;
  onClick?: () => void;
  thumbnailUrl?: string;
}

export function PartCard({ part, onClick, thumbnailUrl }: PartCardProps) {
  const displayThumb = thumbnailUrl || part.files.photos[0];

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <span className="font-mono text-xs font-semibold text-muted-foreground transition-colors group-hover:text-primary">
          {part.reference}
        </span>
        <PartStatusBadge status={part.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-md border border-border/50 bg-muted/60">
          {displayThumb ? (
            <Image
              src={displayThumb}
              alt={part.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Aucun aperçu
            </div>
          )}
        </div>
        <div>
          <h3 className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">
            {part.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{part.description}</p>
        </div>
        <div className="flex items-center justify-between border-t border-border/40 pt-1">
          <MaterialBadge material={part.material} />
          <span className="font-mono text-xs text-muted-foreground">{part.version}</span>
        </div>
      </CardContent>
    </Card>
  );
}
