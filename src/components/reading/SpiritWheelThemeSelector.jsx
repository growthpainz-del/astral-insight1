import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SpiritWheelThemeSelector({ themeId, setThemeId, customTheme, setCustomTheme }) {
  return (
    <div>
      <Label className="text-amber-200 mb-2 block font-semibold text-lg">Wheel Design Theme</Label>
      <Select value={themeId} onValueChange={setThemeId}>
        <SelectTrigger className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100 h-12 text-lg mb-4">
          <SelectValue placeholder="Select a theme" />
        </SelectTrigger>
        <SelectContent className="bg-[#2d1b0d] border-[#5c3a21] text-amber-100">
          <SelectItem value="wood">Classic Wood</SelectItem>
          <SelectItem value="galaxy">Cosmic Galaxy</SelectItem>
          <SelectItem value="neon">Cyber Neon</SelectItem>
          <SelectItem value="parchment">Ancient Parchment</SelectItem>
          <SelectItem value="stone_led">Stone + LED</SelectItem>
          <SelectItem value="metatron">Sacred Geometry</SelectItem>
          <SelectItem value="custom">Custom Build...</SelectItem>
        </SelectContent>
      </Select>
      
      {themeId === 'custom' && (
        <div className="grid grid-cols-2 gap-4 mb-4 bg-black/30 p-3 rounded-lg border border-[#5c3a21]">
          <div>
            <Label className="text-amber-200/80 text-xs">Outer Ring</Label>
            <div className="flex gap-2 mt-1 mb-1">
              <input type="color" value={customTheme.outerBg} onChange={e => setCustomTheme({...customTheme, outerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
              <input type="color" value={customTheme.outerGrad} onChange={e => setCustomTheme({...customTheme, outerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
            </div>
            <Input value={customTheme.outerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, outerTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1" />
          </div>
          <div>
            <Label className="text-amber-200/80 text-xs">Middle Ring</Label>
            <div className="flex gap-2 mt-1 mb-1">
              <input type="color" value={customTheme.middleBg} onChange={e => setCustomTheme({...customTheme, middleBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
              <input type="color" value={customTheme.middleGrad} onChange={e => setCustomTheme({...customTheme, middleGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
            </div>
            <Input value={customTheme.middleTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, middleTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1" />
          </div>
          <div>
            <Label className="text-amber-200/80 text-xs">Inner Ring</Label>
            <div className="flex gap-2 mt-1 mb-1">
              <input type="color" value={customTheme.innerBg} onChange={e => setCustomTheme({...customTheme, innerBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
              <input type="color" value={customTheme.innerGrad} onChange={e => setCustomTheme({...customTheme, innerGrad: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
            </div>
            <Input value={customTheme.innerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => setCustomTheme({...customTheme, innerTextureUrl: e.target.value})} placeholder="Texture URL" className="bg-black/40 border-white/10 text-[10px] h-6 px-1" />
          </div>
          <div>
            <Label className="text-amber-200/80 text-xs">Text & Dots</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={customTheme.textOuter} onChange={e => setCustomTheme({...customTheme, textOuter: e.target.value, textMiddle: e.target.value, textInner: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
              <input type="color" value={customTheme.pin} onChange={e => setCustomTheme({...customTheme, pin: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
            </div>
          </div>
          <div>
            <Label className="text-amber-200/80 text-xs">Borders</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={customTheme.outerBorder} onChange={e => setCustomTheme({...customTheme, outerBorder: e.target.value, middleBorder: e.target.value, innerBorder: e.target.value, hubBorder: e.target.value, divider: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
            </div>
          </div>
          <div>
            <Label className="text-amber-200/80 text-xs">Page Background</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={customTheme.pageBg || "#0f172a"} onChange={e => setCustomTheme({...customTheme, pageBg: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
            </div>
          </div>
          <div className="col-span-2 hidden">
            <Label className="text-amber-200/80 text-xs">Global Texture URL</Label>
            <Input value={customTheme.textureUrl} onChange={e => setCustomTheme({...customTheme, textureUrl: e.target.value})} className="bg-black/40 border-white/10 mt-1 text-xs h-8" />
          </div>
          <div className="col-span-2">
            <Label className="text-amber-200/80 text-xs block mb-1">Layer & Blending Options</Label>
            <div className="flex gap-2">
              <Select value={customTheme.layerOrder || 'texture_top'} onValueChange={v => setCustomTheme({...customTheme, layerOrder: v})}>
                <SelectTrigger className="bg-black/40 border-white/10 text-[10px] h-7 flex-1" title="Layer Order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="texture_top">Texture on Top</SelectItem>
                  <SelectItem value="color_top">Color on Top</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-md px-1 h-7">
                <span className="text-[10px] text-amber-200/60 whitespace-nowrap">Opacity:</span>
                <Input type="number" min="0" max="100" value={customTheme.topLayerOpacity !== undefined ? Math.round(customTheme.topLayerOpacity * 100) : 100} onChange={e => setCustomTheme({...customTheme, topLayerOpacity: Number(e.target.value)/100})} className="w-10 bg-transparent border-none text-[10px] h-5 p-0 text-center focus-visible:ring-0 outline-none" />
                <span className="text-[10px] text-amber-200/60">%</span>
              </div>
              <Select value={customTheme.blendMode || 'multiply'} onValueChange={v => setCustomTheme({...customTheme, blendMode: v})}>
                <SelectTrigger className="bg-black/40 border-white/10 text-[10px] h-7 flex-1" title="Blend Mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="multiply">Multiply</SelectItem>
                  <SelectItem value="overlay">Overlay</SelectItem>
                  <SelectItem value="screen">Screen</SelectItem>
                  <SelectItem value="soft-light">Soft Light</SelectItem>
                  <SelectItem value="hard-light">Hard Light</SelectItem>
                  <SelectItem value="color-burn">Color Burn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-amber-200/80 text-xs">Page Background Image URL</Label>
            <Input value={customTheme.pageBgImage || ""} onChange={e => setCustomTheme({...customTheme, pageBgImage: e.target.value})} className="bg-black/40 border-white/10 mt-1 text-xs h-8" />
          </div>
        </div>
      )}
    </div>
  );
}