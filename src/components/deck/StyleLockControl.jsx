import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, Unlock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StyleLockControl({ 
  styleProfile, 
  styleLocked, 
  onStyleLockChange, 
  onReanalyze,
  disabled = false 
}) {
  if (!styleProfile) return null;

  return (
    <div className="space-y-3">
      {/* Style Profile Summary */}
      <div className="bg-emerald-900/20 border border-emerald-500/40 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-300">Style Profile Extracted!</p>
            <p className="text-xs text-emerald-200 mt-1">
              Analyzed {styleProfile.reference_card_count} cards. Ready for uniform generation.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReanalyze}
            className="text-emerald-300 hover:text-emerald-200 text-xs"
          >
            Re-analyze
          </Button>
        </div>

        {styleProfile.color_palette?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {styleProfile.color_palette.map((color, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded border border-white/20"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {styleProfile.style_keywords?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {styleProfile.style_keywords.slice(0, 8).map((keyword, idx) => (
              <Badge key={idx} className="bg-emerald-600/40 border-emerald-400/40 text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Style Lock Toggle */}
      <div className={`rounded-lg p-4 border-2 transition-all ${
        styleLocked 
          ? 'bg-amber-900/30 border-amber-500/50' 
          : 'bg-blue-900/20 border-blue-500/30'
      }`}>
        <div className="flex items-start gap-3">
          {styleLocked ? (
            <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Unlock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className={`font-bold ${styleLocked ? 'text-amber-300' : 'text-blue-300'}`}>
                🔒 Style Lock for Uniform Collections
              </Label>
              <Switch
                checked={styleLocked}
                onCheckedChange={onStyleLockChange}
                disabled={disabled}
              />
            </div>
            {styleLocked ? (
              <div>
                <p className="text-xs text-amber-200 mb-2">
                  <strong>LOCKED:</strong> Maximum style enforcement enabled. AI will prioritize maintaining exact visual consistency across all cards. Perfect for oracle decks where uniformity is essential.
                </p>
                <ul className="text-xs text-amber-200 space-y-1 list-disc list-inside">
                  <li>5x style keyword repetition in prompts</li>
                  <li>Mandatory color palette compliance</li>
                  <li>Prioritizes visual cohesion over card-specific interpretation</li>
                </ul>
              </div>
            ) : (
              <p className="text-xs text-blue-200">
                <strong>UNLOCKED:</strong> Style DNA will guide the generation process, but AI retains flexibility to interpret each card's unique meaning and essence. Best for decks where variety within a theme is desired.
              </p>
            )}
          </div>
        </div>

        {styleLocked && (
          <div className="mt-3 bg-amber-950/40 rounded-lg p-3 border border-amber-500/20">
            <p className="text-xs text-amber-100 flex items-center gap-2">
              <Info className="w-3 h-3 flex-shrink-0" />
              <span>
                Style Lock enforces 5x keyword repetition + mandatory color compliance in AI prompts for maximum uniformity across your collection
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}