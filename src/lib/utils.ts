import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cleans song/artist names by:
 * - Removing HTML entities (&quot;, &amp;, etc.)
 * - Removing redundant movie/album names in parentheses
 * - Trimming whitespace
 */
export function cleanName(name: string): string {
  if (!name) return "";
  
  // Decode HTML entities
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = name;
  let cleaned = tempDiv.textContent || tempDiv.innerText || "";
  
  // Remove patterns like "Song Name (From "Movie Name")" or "Song (Album)"
  cleaned = cleaned.replace(/\s*\(From\s+["']([^"']+)["']\)/gi, "");
  cleaned = cleaned.replace(/\s*\(feat\.\s+[^)]+\)/gi, "");
  
  // Remove HTML entities that might remain
  cleaned = cleaned.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  
  return cleaned.trim();
}
