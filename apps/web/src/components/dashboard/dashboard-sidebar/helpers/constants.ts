import { NotebookTextIcon, SettingsIcon, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Lessons", icon: NotebookTextIcon },
  { href: "/set-password", label: "Settings", icon: SettingsIcon },
];
