import { Card as CardEntity } from "@/entities/all";
import { safeUpdateCard } from "@/components/utils/safeEntityUpdate";

// Patch CardEntity.update once per bundle load so all module calls get resilience
if (CardEntity && typeof CardEntity.update === "function" && !CardEntity._safePatched) {
  const orig = CardEntity.update.bind(CardEntity);
  CardEntity.update = (id, data) => safeUpdateCard(CardEntity, id, data, orig);
  CardEntity._safePatched = true;
}