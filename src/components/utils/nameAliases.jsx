export function deckDisplayName(name) {
  if (!name) return name;
  const n = String(name).trim().toLowerCase();
  if (n === "rooted c") return "Rooted Crescent";
  return name;
}