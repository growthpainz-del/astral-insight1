import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Calendar } from "lucide-react";

export default function FreeLimitReached({ featureName, onClose, isDailyLimit = false }) {
  const Icon = isDailyLimit ? Calendar : Lock;
  const title = isDailyLimit ? `Daily ${featureName} Limit Reached` : `${featureName} Limit Reached`;
  const message = isDailyLimit
    ? "You've used your free AI reading for today. Please come back tomorrow for another insight!"
    : `You have reached the free limit for ${featureName}. Upgrade to Premium for unlimited access.`;

  return (
    <Card className="bg-gradient-to-r from-amber-600/10 to-purple-600/10 border-amber-500/30">
      <CardContent className="p-6 text-center">
        <Icon className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="font-bold text-white mb-2">{title}</h3>
        <p className="text-purple-200 text-sm mb-4">{message}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            Close
          </Button>
        </div>
        <p className="text-xs text-purple-300 mt-4">
          During beta, premium features are not yet available for purchase. Thank you for helping us test!
        </p>
      </CardContent>
    </Card>
  );
}