import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music } from "lucide-react";
import { motion } from "framer-motion";

export default function AudioPlayer({ src, title }) {
  if (!src) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4"
    >
      <Card className="bg-gradient-to-br from-indigo-900/30 via-blue-900/30 to-slate-900/30 border-blue-500/40">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto bg-blue-500/20 p-3 rounded-full w-fit">
            <Music className="w-6 h-6 text-blue-300" />
          </div>
          <CardTitle className="text-blue-200 text-lg">Audio Preview: {title}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <audio controls autoPlay controlsList="nodownload" src={src} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </CardContent>
      </Card>
    </motion.div>
  );
}