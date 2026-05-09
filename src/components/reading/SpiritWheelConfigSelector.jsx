import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Plus, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CATEGORIES } from '@/lib/spiritWheelData';

export default function SpiritWheelConfigSelector({ selectedWheelId, setSelectedWheelId, customWheels, category, setCategory, currentUser }) {
  const navigate = useNavigate();

  return (
    <div>
      <Label className="text-amber-200 mb-2 block font-semibold text-lg">Choose Wheel</Label>
      <Select value={selectedWheelId} onValueChange={setSelectedWheelId}>
        <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 max-h-64 overflow-y-auto">
          <SelectItem value="default">Rooted Crescent Wheel</SelectItem>
          {customWheels.map(w => (
            <SelectItem key={w.id} value={w.id}>{w.name} {w.publish_status === 'draft' ? '(Draft)' : ''}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex gap-2 mb-4">
        <Button onClick={() => navigate(createPageUrl("SpiritWheelDesigner"))} variant="outline" className="flex-1 w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
          <Plus className="w-4 h-4 mr-2" /> New Wheel
        </Button>
        {selectedWheelId !== "default" && customWheels.find(w => w.id === selectedWheelId)?.created_by === currentUser?.email ? (
          <Button onClick={() => navigate(`${createPageUrl("SpiritWheelDesigner")}?id=${selectedWheelId}`)} variant="outline" className="flex-1 w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
            <Sparkles className="w-4 h-4 mr-2" /> Edit Wheel
          </Button>
        ) : selectedWheelId === "default" && (
          <Button onClick={() => navigate(`${createPageUrl("SpiritWheelDesigner")}?clone=default`)} variant="outline" className="flex-1 w-full bg-[#1c0f05] hover:bg-[#2d1b0d] border-[#5c3a21] text-amber-300">
            <Copy className="w-4 h-4 mr-2" /> Clone to Edit
          </Button>
        )}
      </div>

      {selectedWheelId === "default" && (
        <>
          <Label className="text-amber-200 mb-2 block font-semibold text-lg">Category-Shift Logic</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}