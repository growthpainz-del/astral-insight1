export function safeText(val) {
  if (val == null) return "";
  const t = typeof val;
  if (t === "string" || t === "number" || t === "boolean") return String(val);
  if (t === "object") {
    // Prefer common human-readable fields
    if (typeof val.name === "string") return val.name;
    if (typeof val.title === "string") return val.title;
    if (typeof val.value === "string" || typeof val.value === "number") return String(val.value);
    try {
      return JSON.stringify(val);
    } catch {
      return "";
    }
  }
  return "";
}