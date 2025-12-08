import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

export default function DemoModeBadge() {
  const endDemo = () => {
    sessionStorage.removeItem('isDemoActive');
    window.location.reload();
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/80 to-purple-500/80 rounded-lg p-3 text-white text-center shadow-lg shadow-amber-500/20">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-bold">Premium Demo Active</h3>
      </div>
      <p className="text-xs text-amber-100 mb-3">
        All premium features are unlocked for this session.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={endDemo}
        className="h-7 text-xs bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white"
      >
        <X className="w-3 h-3 mr-1" />
        End Demo
      </Button>
    </div>
  );
}