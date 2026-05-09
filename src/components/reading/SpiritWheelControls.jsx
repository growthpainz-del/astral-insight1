import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function SpiritWheelControls({ intentionPhrase, setIntentionPhrase, spinSpeed, setSpinSpeed, spinState, spinWheel }) {
  return (
    <div className="w-full max-w-md mt-12 space-y-4 z-20 relative px-4">
      <div className="flex flex-col gap-2">
        <Label className="text-amber-200/80 text-xs">Intention Phrase (Optional Seed)</Label>
        <Input 
          value={intentionPhrase} 
          onChange={(e) => setIntentionPhrase(e.target.value)} 
          placeholder="e.g. Guidance for today..." 
          disabled={spinState !== "idle"}
          className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 placeholder:text-amber-100/30"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-amber-200/80 text-xs">Spin Speed</Label>
          <Select value={spinSpeed.toString()} onValueChange={(v) => setSpinSpeed(parseFloat(v))} disabled={spinState !== "idle"}>
            <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
              <SelectItem value="0.5">Slow</SelectItem>
              <SelectItem value="1">Normal</SelectItem>
              <SelectItem value="2">Fast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {spinState === "idle" ? (
        <Button 
          onClick={spinWheel} 
          className="w-full bg-[#8b5a2b] hover:bg-[#a66d35] text-amber-50 py-8 text-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.4)] border border-[#a66d35] active:scale-95 transition-transform"
        >
          <Sparkles className="w-6 h-6 mr-3" />
          Spin the Wheel
        </Button>
      ) : (
        <Button 
          disabled
          className="w-full bg-amber-900/50 text-amber-50/50 py-8 text-xl border border-amber-900/50 cursor-not-allowed"
        >
          <RefreshCw className="animate-spin w-6 h-6 mr-3" />
          Channeling Spirits...
        </Button>
      )}
      <div className="text-center text-amber-200/50 text-sm italic pt-2">
        👆 Or tap the wheel directly to spin
      </div>
    </div>
  );
}