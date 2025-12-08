import React from "react";
import { Coins, Zap, Sparkles } from "lucide-react";

/**
 * Updated pricing guide with NEW LOWER COSTS
 */
export default function TokenomicsGuide() {
  return (
    <div className="bg-slate-900/50 border border-purple-500/30 rounded-xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Coins className="w-8 h-8 text-amber-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Token Pricing Guide</h2>
          <p className="text-purple-300 text-sm">Updated pricing - Better value for everyone!</p>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Subscription Tiers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mystic Tier */}
          <div className="bg-purple-900/20 border border-purple-500/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white">Mystic Tier</h4>
              <span className="text-purple-300 font-semibold">$4.99/mo</span>
            </div>
            <p className="text-amber-400 font-bold text-lg mb-2">50 tokens/month</p>
            <p className="text-sm text-purple-300">~50 readings or 25 images</p>
          </div>

          {/* Oracle Pro */}
          <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white">Oracle Pro</h4>
              <span className="text-blue-300 font-semibold">$12.99/mo</span>
            </div>
            <p className="text-amber-400 font-bold text-lg mb-2">150 tokens/month</p>
            <p className="text-sm text-blue-300">~150 readings or 75 images</p>
          </div>

          {/* Creator Studio */}
          <div className="bg-amber-900/20 border border-amber-500/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white">Creator Studio</h4>
              <span className="text-amber-300 font-semibold">$24.99/mo</span>
            </div>
            <p className="text-amber-400 font-bold text-lg mb-2">400 tokens/month</p>
            <p className="text-sm text-amber-300">~400 readings or 200 images</p>
          </div>
        </div>
      </div>

      {/* Token Costs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Token Costs per Action
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <span className="text-white">AI Reading (any spread)</span>
            <span className="text-amber-400 font-bold">1 token</span>
          </div>
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <span className="text-white">Fusion Reading</span>
            <span className="text-amber-400 font-bold">1 token</span>
          </div>
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <span className="text-white">AI Image Generation</span>
            <span className="text-amber-400 font-bold">2 tokens</span>
          </div>
        </div>
      </div>

      {/* One-Time Packs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Coins className="w-5 h-5 text-emerald-400" />
          One-Time Token Packs
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 border border-white/10 p-3 rounded-lg">
            <p className="text-white font-semibold">20 tokens</p>
            <p className="text-purple-300 text-sm">$1.99</p>
          </div>
          <div className="bg-slate-800/50 border border-emerald-500/40 p-3 rounded-lg">
            <p className="text-white font-semibold">50 tokens ⭐</p>
            <p className="text-emerald-300 text-sm">$3.99 (Most Popular)</p>
          </div>
          <div className="bg-slate-800/50 border border-white/10 p-3 rounded-lg">
            <p className="text-white font-semibold">100 tokens</p>
            <p className="text-purple-300 text-sm">$6.99 (20% savings)</p>
          </div>
          <div className="bg-slate-800/50 border border-amber-500/40 p-3 rounded-lg">
            <p className="text-white font-semibold">200 tokens 🎨</p>
            <p className="text-amber-300 text-sm">$12.99 (Best Value!)</p>
          </div>
        </div>
      </div>

      {/* Value Explanation */}
      <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4">
        <p className="text-sm text-purple-200">
          <strong className="text-white">New Lower Pricing!</strong> We've reduced costs across the board:
        </p>
        <ul className="text-sm text-purple-300 mt-2 space-y-1 ml-4">
          <li>✅ All readings now 1 token (was up to 2)</li>
          <li>✅ Fusion readings 1 token (was 2)</li>
          <li>✅ AI images 2 tokens (was 3)</li>
          <li>✅ Subscription prices lowered 30-40%</li>
          <li>✅ More tokens per tier</li>
        </ul>
      </div>
    </div>
  );
}