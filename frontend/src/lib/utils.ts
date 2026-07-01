import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function renderDanmaku(template: string, song: { name: string; singer?: string; language?: string }) {
  return template
    .replace(/\{name\}/g, song.name)
    .replace(/\{singer\}/g, song.singer ?? "")
    .replace(/\{language\}/g, song.language ?? "")
    .trim()
}
