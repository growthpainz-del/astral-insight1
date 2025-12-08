
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradePrompt({ onClose }) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate(createPageUrl('Upgrade'));
    if(onClose) onClose();
  };

  return (
    <Card className="bg-gradient-to-br from-amber-900/30 via-purple-900/30 to-slate-900/30 border-amber-500/40 text-center">
      <CardHeader>
        <div className="mx-auto bg-amber-500/20 p-3 rounded-full w-fit">
          <Crown className="w-8 h-8 text-amber-300" />
        </div>
        {/* The CardTitle is now hardcoded to "Cosmic Fusions" as per the requirement */}
        <CardTitle className="text-amber-200 text-2xl mt-2">Unlock Cosmic Fusions</CardTitle>
        <CardDescription className="text-purple-200">
          This is a Premium Feature
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* The featureDescription is now hardcoded to the new description */}
        <p className="text-white mb-6">Unlock the secrets of your personal numerology, guided by the ancient wisdom of the runes and oracle cards fused into one powerful reading.</p>
        <Button
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
        >
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
}
