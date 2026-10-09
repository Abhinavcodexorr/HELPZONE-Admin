import { IdType } from "@/types";

const idTypeGradients: Record<IdType, [string, string]> = {
  "Aadhaar Card": ["#6366f1", "#4338ca"],
  Passport: ["#0ea5e9", "#0369a1"],
  "National ID": ["#8b5cf6", "#6d28d9"],
  "Driving License": ["#f59e0b", "#b45309"],
};

function svgToDataUri(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function idDocumentImage(idType: IdType, idNumber: string) {
  const [from, to] = idTypeGradients[idType];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}" />
      <stop offset="1" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="320" height="200" rx="14" fill="url(#g)" />
  <rect x="18" y="18" width="56" height="56" rx="10" fill="rgba(255,255,255,0.25)" />
  <circle cx="46" cy="42" r="12" fill="rgba(255,255,255,0.85)" />
  <rect x="30" y="58" width="32" height="10" rx="5" fill="rgba(255,255,255,0.7)" />
  <rect x="18" y="90" width="150" height="10" rx="5" fill="rgba(255,255,255,0.9)" />
  <rect x="18" y="108" width="110" height="8" rx="4" fill="rgba(255,255,255,0.55)" />
  <rect x="18" y="130" width="200" height="8" rx="4" fill="rgba(255,255,255,0.55)" />
  <rect x="18" y="148" width="130" height="8" rx="4" fill="rgba(255,255,255,0.4)" />
  <text x="18" y="184" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.85)">${idType}</text>
  <text x="302" y="184" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.85)" text-anchor="end">${idNumber}</text>
</svg>`.trim();
  return svgToDataUri(svg);
}

export function photoImage(name: string, color: string) {
  const letter = name.trim().charAt(0).toUpperCase();
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240" viewBox="0 0 200 240">
  <rect width="200" height="240" fill="${color}" />
  <circle cx="100" cy="96" r="42" fill="rgba(255,255,255,0.9)" />
  <ellipse cx="100" cy="210" rx="70" ry="60" fill="rgba(255,255,255,0.9)" />
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="${color}" text-anchor="middle">${letter}</text>
</svg>`.trim();
  return svgToDataUri(svg);
}
