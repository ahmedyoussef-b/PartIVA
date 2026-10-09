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
      className="group hover:border-primary/50 focus-visible:ring-ring cursor-pointer transition-all hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
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
        <span className="text-muted-foreground group-hover:text-primary font-mono text-xs font-semibold transition-colors">
          {part.reference}
        </span>
        <PartStatusBadge status={part.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="border-border/50 bg-muted/60 relative aspect-square overflow-hidden rounded-md border">
          {displayThumb ? (
            <Image
              src={displayThumb}
              alt={part.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Aucun aperçu
            </div>
          )}
        </div>
        <div>
          <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
            {part.name}
          </h3>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{part.description}</p>
        </div>
        <div className="border-border/40 flex items-center justify-between border-t pt-1">
          <MaterialBadge material={part.material} />
          <span className="text-muted-foreground font-mono text-xs">{part.version}</span>
        </div>
      </CardContent>
    </Card>
  );
}
