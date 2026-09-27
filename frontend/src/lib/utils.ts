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

/** 取 FastAPI 错误响应里的 detail 文案 */
export function errorDetail(err: unknown): string | undefined {
  const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
  return typeof detail === 'string' ? detail : undefined;
}
