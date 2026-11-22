"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/today", "Today's Plan"],
  ["/weekly", "Weekly Plan"],
  ["/progress", "Progress"],
  ["/grocery", "Grocery List"],
  ["/foods", "Foods"],
  ["/settings", "Settings"],
] as const;

const MOBILE_PRIMARY = LINKS.slice(0, 5);

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/caloriq-logo.jpg" alt="Caloriq logo" width={40} height={40} className="rounded-xl object-cover" />
      {!compact && <span className="text-xl font-bold text-primary">Caloriq</span>}
    </span>
  );
}

export function AppNav({ userName, children }: { userName: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition ${
      path === href ? "bg-primary/10 text-primary" : "text-muted hover:bg-bg hover:text-fg"
    }`;

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} onClick={() => setOpen(false)} className={linkClass(href)}>
          {label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-border pt-4">
      <p className="mb-2 truncate text-sm text-muted">{userName}</p>
      <form action={logout}>
        <button className="btn-ghost w-full !py-2 text-sm">Log out</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 border-r border-border bg-card p-5 md:flex">
        <Link href="/dashboard">
          <Brand />
        </Link>
        {nav}
        {footer}
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href="/dashboard">
          <Brand compact />
        </Link>
        <button className="btn-ghost !px-3 !py-1.5 text-sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[73px] z-30 flex max-h-[calc(100vh-73px)] flex-col gap-4 overflow-y-auto border-b border-border bg-card p-4 shadow-md md:hidden">
          {nav}
          {footer}
        </div>
      )}

      <div className="pb-20 md:pb-0 md:pl-64">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {MOBILE_PRIMARY.map(([href, label]) => {
            const active = path === href;
            const shortLabel = label.replace("'s ", " ").replace(" Plan", "");
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-xl px-1 text-center text-[11px] font-medium leading-tight ${
                  active ? "bg-primary/10 text-primary" : "text-muted"
                }`}
              >
                <span>{shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
