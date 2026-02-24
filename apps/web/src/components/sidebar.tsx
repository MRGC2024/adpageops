"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/integrations", label: "Integrações" },
  { href: "/alerts", label: "Alertas" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 border-r border-border min-h-screen p-4 flex flex-col">
      <Link href="/dashboard" className="font-semibold text-lg mb-6">AdPageOps</Link>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-md text-sm ${pathname.startsWith(href) ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
