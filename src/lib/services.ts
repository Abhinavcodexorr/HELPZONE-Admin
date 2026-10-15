import { labelForCategory } from "@/lib/map-provider";

// Mirrors the backend: "Cook & Chef" -> "cat-cook-chef".
export function keyFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `cat-${slug}` : "";
}

export const nameFromKey = labelForCategory;
