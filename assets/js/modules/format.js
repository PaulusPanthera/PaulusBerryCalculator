// assets/js/modules/format.js
// v2.0.0-beta
// Shared formatters and HTML escaping helpers for BerryDex and seed calculator UI.
export function formatMoney(value) {
  return `${Number(value).toLocaleString("en-US")} ¥`;
}

export function formatSignedMoney(value) {
  const amount = Number(value);
  const prefix = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${prefix}${Math.abs(amount).toLocaleString("en-US")} ¥`;
}

export function formatHours(value) {
  return `${Number(value)}h`;
}

export function formatYield(value) {
  return `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })} / plot`;
}

export function formatNumber(value) {
  return Number(value).toLocaleString("en-US");
}

export function formatSignedNumber(value) {
  const amount = Number(value);
  const prefix = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${prefix}${Math.abs(amount).toLocaleString("en-US")}`;
}

export function formatPercent(value) {
  return `${(Number(value) * 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}%`;
}

export function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatYieldProfile(values) {
  return values.join(" · ");
}
