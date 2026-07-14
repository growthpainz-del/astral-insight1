import React from 'react';

export default function SpiritWheelThemeSelector({ themeId, setThemeId, customTheme, setCustomTheme }) {
  const handleCustomThemeChange = (updates) => {
    setCustomTheme(prev => ({ ...prev, ...updates }));
    setThemeId("custom");
  };
  return (
    <>
      <div 
        className="flex items-center gap-[8px] mb-[14px] text-[12px] tracking-[0.14em] uppercase text-[#c9a84c]"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        ⊙ Wheel Design Theme
      </div>
      <div>
        <div 
          className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Theme
        </div>
        <select 
          value={themeId} onChange={(e) => setThemeId(e.target.value)}
          className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[10px] px-[14px] py-[11px] text-[15px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer transition-colors duration-250 focus:border-[#c9a84c]/40 mb-[12px]"
          style={{ 
            fontFamily: "'Crimson Text', serif",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 13px center"
          }}
        >
          <option value="wood" style={{ background: "#160f2a" }}>Classic Wood</option>
          <option value="galaxy" style={{ background: "#160f2a" }}>Cosmic Galaxy</option>
          <option value="neon" style={{ background: "#160f2a" }}>Cyber Neon</option>
          <option value="parchment" style={{ background: "#160f2a" }}>Ancient Parchment</option>
          <option value="stone_led" style={{ background: "#160f2a" }}>Stone + LED</option>
          <option value="metatron" style={{ background: "#160f2a" }}>Sacred Geometry</option>
          <option value="custom" style={{ background: "#160f2a" }}>Custom Build...</option>
        </select>
      </div>

      {themeId === 'custom' && (
        <div className="space-y-[12px] p-[16px] bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[10px]">
          <h4 className="text-[11px] font-semibold text-[#c9a84c] uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>Custom Colors & Textures</h4>
          
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="color-item">
              <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Outer Ring</div>
              <div className="flex gap-[6px] mb-[6px]">
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.outerBg }}>
                  <input type="color" value={customTheme.outerBg} onChange={e => handleCustomThemeChange({ outerBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Background" />
                </div>
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.outerGrad }}>
                  <input type="color" value={customTheme.outerGrad} onChange={e => handleCustomThemeChange({ outerGrad: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Gradient" />
                </div>
              </div>
              <input 
                value={customTheme.outerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => handleCustomThemeChange({ outerTextureUrl: e.target.value})} 
                placeholder="Texture URL" 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none"
                style={{ fontFamily: "'Crimson Text', serif" }}
              />
            </div>
            
            <div className="color-item">
              <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Middle Ring</div>
              <div className="flex gap-[6px] mb-[6px]">
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.middleBg }}>
                  <input type="color" value={customTheme.middleBg} onChange={e => handleCustomThemeChange({ middleBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Background" />
                </div>
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.middleGrad }}>
                  <input type="color" value={customTheme.middleGrad} onChange={e => handleCustomThemeChange({ middleGrad: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Gradient" />
                </div>
              </div>
              <input 
                value={customTheme.middleTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => handleCustomThemeChange({ middleTextureUrl: e.target.value})} 
                placeholder="Texture URL" 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none"
                style={{ fontFamily: "'Crimson Text', serif" }}
              />
            </div>
            
            <div className="color-item">
              <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Inner Ring</div>
              <div className="flex gap-[6px] mb-[6px]">
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.innerBg }}>
                  <input type="color" value={customTheme.innerBg} onChange={e => handleCustomThemeChange({ innerBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Background" />
                </div>
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.innerGrad }}>
                  <input type="color" value={customTheme.innerGrad} onChange={e => handleCustomThemeChange({ innerGrad: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Gradient" />
                </div>
              </div>
              <input 
                value={customTheme.innerTextureUrl ?? customTheme.textureUrl ?? ''} onChange={e => handleCustomThemeChange({ innerTextureUrl: e.target.value})} 
                placeholder="Texture URL" 
                className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none"
                style={{ fontFamily: "'Crimson Text', serif" }}
              />
            </div>
            
            <div className="color-item">
              <div className="text-[8.5px] tracking-[0.14em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Text & Dots</div>
              <div className="flex gap-[6px] mb-[6px]">
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.textOuter || "#2a1505" }}>
                  <input type="color" value={customTheme.textOuter || "#2a1505"} onChange={e => handleCustomThemeChange({ textOuter: e.target.value, textMiddle: e.target.value, textInner: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Text Color" />
                </div>
                <div className="w-[30px] h-[30px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] transition-transform duration-200 hover:scale-110 overflow-hidden relative" style={{ background: customTheme.pin || "#f5f5f5" }}>
                  <input type="color" value={customTheme.pin || "#f5f5f5"} onChange={e => handleCustomThemeChange({ pin: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Pin Color" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[8px] mt-[4px]">
             <div className="w-[32px] h-[32px] rounded-[7px] cursor-pointer bg-[#2a1505] border-[2px] border-[rgba(201,168,76,0.2)] overflow-hidden relative" style={{ background: customTheme.outerBorder || "#2a1505" }}>
                <input type="color" value={customTheme.outerBorder || "#2a1505"} onChange={e => handleCustomThemeChange({ outerBorder: e.target.value, middleBorder: e.target.value, innerBorder: e.target.value, hubBorder: e.target.value, divider: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Border Color" />
             </div>
             <input 
               type="number" min="0" max="20" 
               value={customTheme.borderThickness ?? 6} 
               onChange={e => handleCustomThemeChange({ borderThickness: Number(e.target.value)})} 
               className="w-[52px] bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[9px] py-[7px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none text-center"
               style={{ fontFamily: "'Crimson Text', serif" }}
             />
             <select 
               value={customTheme.borderStyle || "solid"} 
               onChange={e => handleCustomThemeChange({ borderStyle: e.target.value})}
               className="flex-1 bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[10px] py-[7px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none appearance-none"
               style={{ fontFamily: "'Crimson Text', serif" }}
             >
               <option value="solid" style={{ background: "#160f2a" }}>Solid</option>
               <option value="dashed" style={{ background: "#160f2a" }}>Dashed</option>
               <option value="dotted" style={{ background: "#160f2a" }}>Dotted</option>
               <option value="double" style={{ background: "#160f2a" }}>Double</option>
             </select>
             <div className="flex-1"></div>
             <div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Page Bg</div>
                <div className="w-[32px] h-[32px] rounded-[7px] cursor-pointer border-[2px] border-[rgba(255,255,255,0.15)] overflow-hidden relative" style={{ background: customTheme.pageBg || "#0d0e1a" }}>
                  <input type="color" value={customTheme.pageBg || "#0f172a"} onChange={e => handleCustomThemeChange({ pageBg: e.target.value})} className="absolute inset-[-10px] w-[50px] h-[50px] opacity-0 cursor-pointer" title="Page Background Color" />
                </div>
             </div>
          </div>

          <div className="mt-[12px]">
            <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[6px]" style={{ fontFamily: "'Cinzel', serif" }}>Layer & Blending Options</div>
            <div className="flex gap-[8px] items-center flex-wrap">
              <select 
                value={customTheme.layerOrder || 'texture_top'} 
                onChange={e => handleCustomThemeChange({ layerOrder: e.target.value})}
                className="bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[10px] py-[7px] text-[13px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer"
                style={{ 
                  fontFamily: "'Crimson Text', serif",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "28px"
                }}
              >
                <option value="texture_top" style={{ background: "#160f2a" }}>Texture on Top</option>
                <option value="color_top" style={{ background: "#160f2a" }}>Color on Top</option>
              </select>
              
              <span className="text-[8.5px] tracking-[0.1em] text-[rgba(180,160,220,0.42)] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>TOP OPACITY:</span>
              
              <input 
                type="number" min="0" max="100" 
                value={customTheme.topLayerOpacity !== undefined ? Math.round(customTheme.topLayerOpacity * 100) : 100} 
                onChange={e => handleCustomThemeChange({ topLayerOpacity: Number(e.target.value)/100})} 
                className="w-[60px] bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[9px] py-[7px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none text-center"
                style={{ fontFamily: "'Crimson Text', serif" }}
              />
              <span className="text-[10px] text-[rgba(180,160,220,0.42)]" style={{ fontFamily: "'Cinzel', serif" }}>%</span>
              
              <select 
                value={customTheme.blendMode || 'multiply'} 
                onChange={e => handleCustomThemeChange({ blendMode: e.target.value})}
                className="bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[10px] py-[7px] text-[13px] text-[rgba(225,215,255,0.9)] outline-none appearance-none cursor-pointer"
                style={{ 
                  fontFamily: "'Crimson Text', serif",
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%23c9a84c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 10px center",
                  paddingRight: "28px"
                }}
              >
                <option value="normal" style={{ background: "#160f2a" }}>Normal</option>
                <option value="multiply" style={{ background: "#160f2a" }}>Multiply</option>
                <option value="overlay" style={{ background: "#160f2a" }}>Overlay</option>
                <option value="screen" style={{ background: "#160f2a" }}>Screen</option>
                <option value="soft-light" style={{ background: "#160f2a" }}>Soft Light</option>
                <option value="hard-light" style={{ background: "#160f2a" }}>Hard Light</option>
                <option value="color-burn" style={{ background: "#160f2a" }}>Color Burn</option>
              </select>
            </div>
          </div>

          <div>
             <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Global Texture URL</div>
             <input 
               value={customTheme.textureUrl || ""} 
               onChange={e => handleCustomThemeChange({ textureUrl: e.target.value})} 
               placeholder="https://..." 
               className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none"
               style={{ fontFamily: "'Crimson Text', serif" }}
             />
          </div>

          <div>
             <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Center Hub Graphic URL</div>
             <input 
               value={customTheme.centerImage || ""} 
               onChange={e => handleCustomThemeChange({ centerImage: e.target.value})} 
               placeholder="https://..." 
               className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[7px] px-[8px] py-[6px] text-[12px] text-[rgba(180,160,220,0.42)] outline-none"
               style={{ fontFamily: "'Crimson Text', serif" }}
             />
          </div>

          <div>
             <div className="text-[9px] tracking-[0.18em] uppercase text-[rgba(180,160,220,0.42)] mb-[4px]" style={{ fontFamily: "'Cinzel', serif" }}>Page Background Image URL</div>
             <input 
               value={customTheme.pageBgImage || ""} 
               onChange={e => handleCustomThemeChange({ pageBgImage: e.target.value})} 
               placeholder="https://..." 
               className="w-full bg-[#160f2a] border border-[rgba(160,120,255,0.16)] rounded-[9px] px-[12px] py-[9px] text-[14px] text-[rgba(225,215,255,0.9)] outline-none"
               style={{ fontFamily: "'Crimson Text', serif" }}
             />
          </div>
            
        </div>
      )}
    </>
  );
}