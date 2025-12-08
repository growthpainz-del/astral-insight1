export function isNetworkError(error) {
  if (!error) return false;
  const msg = (error.message || error.toString() || "").toLowerCase();
  const byMessage = msg.includes("network error") || msg.includes("failed to fetch");
  const byCode = error.code === "ERR_NETWORK";
  // If axios-style error without response, often a network layer problem
  const noResponse = typeof error === "object" && error.response == null && error.request != null;
  return byMessage || byCode || noResponse;
}