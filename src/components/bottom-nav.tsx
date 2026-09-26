"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, LayoutGrid, ReceiptText, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Обзор", icon: LayoutGrid },
  { href: "/transactions", label: "Операции", icon: ReceiptText },
  { href: "/scan", label: "Чек", icon: ScanLine, primary: true },
  { href: "/banks", label: "Банки", icon: Landmark },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium tracking-wide",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl",
                    item.primary && "bg-primary text-primary-foreground shadow-md",
                    item.primary && active && "ring-2 ring-primary/30",
                    !item.primary && active && "bg-primary/10"
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
