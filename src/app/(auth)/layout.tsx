'use client'

import * as React from 'react'
import Link from 'next/link'
import { Cog } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-background via-muted/20 to-background">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md">
          <Cog className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div className="flex flex-col text-left">
          <span className="font-bold tracking-tight text-base leading-tight">
            PartIVA
          </span>
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            Plastiques Industriels
          </span>
        </div>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
