import React from 'react';
import { Switch } from '@/components/ui/switch';

export default function SpiritWheelDisplayOptions({ blankMode, setBlankMode, showLabels, setShowLabels }) {
  return (
    <>
      <div className="flex items-center justify-between p-4 bg-[#2d1b0d]/50 rounded-lg border border-[#5c3a21]">
        <div>
          <div className="font-semibold text-amber-200">"Blank Tile" Imagine Mode</div>
          <div className="text-sm text-amber-200/60">Hide meanings until you meditate on them</div>
        </div>
        <Switch checked={blankMode} onCheckedChange={setBlankMode} className="data-[state=checked]:bg-amber-600" />
      </div>

      <div className="flex items-center justify-between p-4 bg-[#2d1b0d]/50 rounded-lg border border-[#5c3a21] mt-4">
        <div>
          <div className="font-semibold text-amber-200">Show Symbol Titles</div>
          <div className="text-sm text-amber-200/60">Display names under symbols directly on the wheel</div>
        </div>
        <Switch checked={showLabels} onCheckedChange={setShowLabels} className="data-[state=checked]:bg-amber-600" />
      </div>
    </>
  );
}