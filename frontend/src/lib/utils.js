import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Merges class names and resolves Tailwind conflicts.
// clsx handles conditionals ("a", cond && "b"); twMerge makes the LAST class win
// when two fight, so `cn("px-2", "px-4")` gives "px-4" instead of both.
// Every shadcn component uses this so a `className` prop can always override.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
