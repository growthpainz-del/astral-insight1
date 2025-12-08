import React from "react";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

export default function PremiumBadge({ className = "" }) {
  return (
    <Badge className={`bg-gradient-to-r from-amber-500 to-purple-500 text-white border-0 ${className}`}>
      <Crown className="w-3 h-3 mr-1" />
      Premium
    </Badge>
  );
}