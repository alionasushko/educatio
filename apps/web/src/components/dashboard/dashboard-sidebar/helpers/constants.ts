import { NotebookTextIcon, SettingsIcon, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const SIDEBAR_FRAME =
  "border-border-subtle bg-bg hidden w-60 shrink-0 flex-col border-r px-3.5 py-5 md:sticky md:top-0 md:flex md:h-dvh";

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Lessons", icon: NotebookTextIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];
