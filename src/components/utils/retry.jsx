export function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function retryAsync(fn, retries = 3, delayMs = 400) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;
      const backoff = delayMs * Math.pow(2, attempt);
      await wait(backoff);
      attempt += 1;
    }
  }
  throw lastErr;
}