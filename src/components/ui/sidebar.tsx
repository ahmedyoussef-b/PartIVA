'use client';

import * as React from 'react';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({
  defaultOpen = true,
  children,
  className,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const toggleSidebar = React.useCallback(() => setOpen((prev) => !prev), []);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className={cn('bg-background flex min-h-screen w-full', className)}>{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  className,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  const { open } = useSidebar();

  return (
    <aside
      ref={ref}
      className={cn(
        'bg-card/60 text-card-foreground relative z-30 flex shrink-0 flex-col border-r backdrop-blur transition-all duration-300 ease-in-out',
        open ? 'w-64' : 'w-16',
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn('flex h-16 items-center gap-3 border-b px-4 font-semibold', className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={cn('flex-1 space-y-1 overflow-y-auto px-3 py-4', className)}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref} className={cn('flex items-center border-t p-3', className)} {...props} />;
}

export function SidebarMenu({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLUListElement> & { ref?: React.Ref<HTMLUListElement> }) {
  return <ul ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function SidebarMenuItem({
  className,
  ref,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement> & { ref?: React.Ref<HTMLLIElement> }) {
  return <li ref={ref} className={cn('list-none', className)} {...props} />;
}

interface SidebarMenuButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  asChild?: boolean;
}

export function SidebarMenuButton({
  className,
  active,
  children,
  href,
  ref,
  ...props
}: SidebarMenuButtonProps & { ref?: React.Ref<HTMLAnchorElement> }) {
  return (
    <a
      ref={ref}
      href={href}
      className={cn(
        'hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
          : 'text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export function SidebarInset({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn('flex flex-1 flex-col overflow-hidden', className)} {...props} />
  );
}

export function SidebarTrigger({
  className,
  ref,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: React.Ref<HTMLButtonElement> }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      ref={ref}
      type="button"
      onClick={toggleSidebar}
      className={cn(
        'text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-colors',
        className,
      )}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
}
