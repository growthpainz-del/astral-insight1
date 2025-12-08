import React from "react";
import SpreadDeduper from "@/components/spread/SpreadDeduper";

export default function SpreadCleaner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Spread Cleaner
          </h1>
          <p className="text-white/70 mt-2">
            Identify groups of duplicate spreads and safely remove the extras. By default, the oldest spread in each group is kept.
          </p>
        </div>
        <SpreadDeduper />
      </div>
    </div>
  );
}