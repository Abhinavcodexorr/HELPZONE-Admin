export interface Country {
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  locale?: string;
}

/** 🇮🇳 / 🇦🇺 from the two-letter code. */
export function flagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "🌐";
  return String.fromCodePoint(...[...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// Money is formatted in the currency of the country the admin is working in. The country context sets
// this when the panel loads, so every price and salary on screen follows the selected country.
let active = { currency: "INR", locale: "en-IN" };

export function setActiveCurrency(currency: string, locale?: string) {
  active = { currency, locale: locale || (currency === "AUD" ? "en-AU" : "en-IN") };
}

export function formatMoney(amount: number): string {
  try {
    return new Intl.NumberFormat(active.locale, { style: "currency", currency: active.currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${active.currency}`;
  }
}
