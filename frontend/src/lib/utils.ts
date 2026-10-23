/**
 * Utility functions for Insight Ignite platform.
 */

/**
 * Conditionally join CSS class names into a single string.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
