import React from "react";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TokenBalanceDisplay({ balance, className = "" }) {
  const getBalanceColor = () => {
    if (balance === null || balance === undefined) return "bg-gray-600";
    if (balance >= 50) return "bg-green-600";
    if (balance >= 20) return "bg-yellow-600";
    return "bg-red-600";
  };

  if (balance === null || balance === undefined) {
    return null; // Don't show if user data not loaded yet
  }

  return (
    <Link to={createPageUrl("Upgrade")} className={className}>
      <Badge className={`${getBalanceColor()} hover:opacity-80 transition-opacity cursor-pointer px-3 py-1.5 text-sm font-semibold flex items-center gap-2`}>
        <Coins className="w-4 h-4" />
        {balance} {balance === 1 ? 'token' : 'tokens'}
        {balance < 20 && <TrendingUp className="w-3 h-3 ml-1" />}
      </Badge>
    </Link>
  );
}