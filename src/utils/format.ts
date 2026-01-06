export type NumLike = number | undefined;

export const formatPrice = (v?: number) => {
  if (!v) return "---.--";
  if (v < 1) return v.toFixed(6);
  if (v < 10) return v.toFixed(4);
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatPct = (v?: number) => {
  if (v === undefined) return "0.00%";
  const prefix = v > 0 ? "+" : "";
  return `${prefix}${v.toFixed(2)}%`;
};

export const getPctClass = (v?: number) => {
  if (!v) return "neutral";
  return v >= 0 ? "up" : "down";
};

