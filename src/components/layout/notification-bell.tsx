'use client'

import * as React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(2)

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
        onClick={() => setUnreadCount(0)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </Button>
    </div>
  )
}
