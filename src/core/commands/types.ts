import { LucideIcon } from "lucide-react";

export interface SystemCommand {
    id: string;
    labelKey: string;
    icon: LucideIcon;
    keywords: string[];
    execute: () => void | Promise<void>;
}
