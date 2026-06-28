// Curated subset of currency metadata. The API returns ~160 codes;
// we only need names/symbols for the ones we display richly.
// Featured = shown in the quick-glance ticker by default (most relevant to a ZM-based user).

export const FEATURED_CODES = ['USD', 'GBP', 'EUR', 'ZAR', 'CNY'];

export const CURRENCY_META = {
  USD: { name: 'US Dollar', symbol: '$' },
  GBP: { name: 'British Pound', symbol: '£' },
  EUR: { name: 'Euro', symbol: '€' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  ZMW: { name: 'Zambian Kwacha', symbol: 'K' },
  BWP: { name: 'Botswana Pula', symbol: 'P' },
  TZS: { name: 'Tanzanian Shilling', symbol: 'TSh' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh' },
  NGN: { name: 'Nigerian Naira', symbol: '₦' },
  ZWL: { name: 'Zimbabwean Dollar', symbol: 'Z$' },
  MWK: { name: 'Malawian Kwacha', symbol: 'MK' },
  AED: { name: 'UAE Dirham', symbol: 'AED' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
};

export function currencyLabel(code) {
  const meta = CURRENCY_META[code];
  return meta ? `${code} — ${meta.name}` : code;
}

export function currencySymbol(code) {
  return CURRENCY_META[code]?.symbol || '';
}
