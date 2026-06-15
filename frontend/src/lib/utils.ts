/**
 * Formats a number in Indian numbering system (₹1,23,456.78)
 */
export function formatINR(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats a number with sign prefix in Indian numbering
 */
export function formatINRSigned(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "₹0.00";
  const prefix = num >= 0 ? "+" : "";
  return prefix + formatINR(num);
}

/**
 * Formats a date string to Indian locale
 */
export function formatDate(dateStr: string, style: "short" | "long" = "short"): string {
  const d = new Date(dateStr);
  if (style === "long") {
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
