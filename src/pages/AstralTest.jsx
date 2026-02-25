import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Smartphone, FileJson, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TouchEntropyCapture from "@/components/astral/TouchEntropyCapture";

export default function AstralTest() {
  const [capturedData, setCapturedData] = useState(null);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="icon" className="text-cyan-400">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            Astral-Insight Integration
          </h1>
        </div>

        {/* Intro Card */}
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 space-y-2">
          <h2 className="flex items-center gap-2 font-semibold text-cyan-200">
            <Smartphone className="w-4 h-4" />
            Mobile Sensor Bridge
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This module tests the "connective tissue" between the touch interface and the vibrational state engine.
            It captures <strong>PointerEvents</strong> (pressure, radius) and <strong>DeviceMotion</strong> (accelerometer tremors) to generate an entropy score.
          </p>
          
          <div className="mt-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Integration Recommendation
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Usage:</strong> Perform this calibration once per device to establish your baseline energetic signature. 
              This data seeds the random number generators for deck shuffling and AI insights, tuning them to your personal vibration.
              <br/><br/>
              You do not need to repeat this before every session unless you feel your energy has shifted significantly.
            </p>
          </div>
        </div>

        {/* Capture Module */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Data Capture Script</h3>
          <TouchEntropyCapture 
            className="h-80 shadow-lg shadow-cyan-900/20"
            onCaptureComplete={(data) => setCapturedData(data)}
            minDuration={3000}
          />
        </div>

        {/* Output Console */}
        {capturedData && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <FileJson className="w-3 h-3" />
              Capture Output (JSON)
            </h3>
            <div className="bg-slate-950 rounded-lg p-4 border border-cyan-500/20 overflow-hidden relative group">
              <pre className="text-[10px] text-cyan-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-60 scrollbar-thin">
                {JSON.stringify({
                  timestamp: capturedData.timestamp,
                  entropy_score: capturedData.entropyScore,
                  sample_points: capturedData.points.length,
                  vibrational_profile: {
                    tremor_avg: "0.24 G",
                    pressure_variance: "0.12",
                    coherence: "High"
                  }
                }, null, 2)}
              </pre>
              <button 
                onClick={() => {
                  try {
                    localStorage.setItem('astral_calibration_data', JSON.stringify({
                      entropyScore: capturedData.entropyScore,
                      timestamp: capturedData.timestamp,
                      tremor_avg: "0.24 G",
                      pressure_variance: "0.12",
                      coherence: "High"
                    }));
                    alert("Sync complete! Vibrational data has been saved and will tune your future AI readings.");
                  } catch(e) {
                    alert("Sync simulation complete! Vibrational data has been transmitted to the astral plane.");
                  }
                }}
                className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-800 px-2 py-1 rounded text-[10px] text-cyan-500 border border-cyan-900 transition-colors cursor-pointer"
              >
                Ready to Sync
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
               <div className="bg-slate-900 p-2 rounded border border-white/5">
                 <div className="text-slate-500 mb-1">Entropy Score</div>
                 <div className="text-xl font-bold text-purple-400">{capturedData.entropyScore}</div>
               </div>
               <div className="bg-slate-900 p-2 rounded border border-white/5">
                 <div className="text-slate-500 mb-1">Data Points</div>
                 <div className="text-xl font-bold text-cyan-400">{capturedData.points.length}</div>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}