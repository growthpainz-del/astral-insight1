import { retryAsync } from "@/components/utils/retry";

// Generic safe update for entities with retries/backoff
export async function safeUpdate(entityApi, id, data, origUpdate) {
  const doUpdate = async () => {
    const updateFn = origUpdate ? origUpdate : entityApi.update.bind(entityApi);
    return await updateFn(id, data);
  };
  // 4 attempts, base delay 600ms => ~0.6s, 1.2s, 2.4s, 4.8s (plus jitter inside retryAsync if added)
  return await retryAsync(doUpdate, 4, 600);
}

// Specialized helper for Card updates (kept for clarity/forward-compat)
export async function safeUpdateCard(CardEntity, id, data, origUpdate) {
  return await safeUpdate(CardEntity, id, data, origUpdate);
}