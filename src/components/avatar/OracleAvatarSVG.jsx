import React from "react";

export default function OracleAvatarSVG({ size = 40, talking = false, listening = false, glowColor = "#a855f7" }) {
  const s = size;
  const mouthAnimClass = talking ? "oracle-mouth-talk" : "";
  const headBobClass = talking ? "oracle-bob" : "";
  const auraPulseClass = (talking || listening) ? "oracle-aura" : "";

  return (
    <div style={{ width: s, height: s }} className={`relative select-none ${headBobClass}`}>
      <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={`drop-shadow-[0_0_6px_rgba(168,85,247,0.55)]`}>
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f3e8ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d8b4fe" stopOpacity="0.75" />
          </radialGradient>
          <linearGradient id="hoodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1135" />
            <stop offset="100%" stopColor="#0b0720" />
          </linearGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Aura */}
        <circle cx="50" cy="50" r="46" fill="url(#glowGrad)" className={auraPulseClass} />

        {/* Hooded silhouette */}
        <path d="M50 5 C30 12, 18 30, 16 50 C14 68, 24 82, 50 95 C76 82, 86 68, 84 50 C82 30, 70 12, 50 5 Z" fill="url(#hoodGrad)" stroke="#5b21b6" strokeOpacity="0.25" strokeWidth="1.25" />

        {/* Face oval */}
        <ellipse cx="50" cy="48" rx="20" ry="23" fill="url(#faceGrad)" opacity="0.95" />

        {/* Eyes (calm) */}
        <path d="M40 48 q5 3 10 0" stroke="#3b0764" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M50 48 q5 3 10 0" stroke="#3b0764" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />

        {/* Mouth */}
        <g transform="translate(50,62)">
          <rect x="-5" y="-1.5" width="10" height="3" rx="1.5" fill="#7c3aed" className={mouthAnimClass} />
        </g>

        {/* Hood inner glow edge */}
        <path d="M50 8 C33 15, 22 31, 20 50 C18 66, 27 79, 50 90" fill="none" stroke={glowColor} strokeOpacity="0.25" strokeWidth="1.2" />
        <path d="M50 8 C67 15, 78 31, 80 50 C82 66, 73 79, 50 90" fill="none" stroke={glowColor} strokeOpacity="0.25" strokeWidth="1.2" />
      </svg>

      {/* Inline keyframes for portability */}
      <style>{`
        @keyframes oracleMouth {
          0% { transform: scaleY(0.25); }
          35% { transform: scaleY(1.0); }
          70% { transform: scaleY(0.35); }
          100% { transform: scaleY(0.25); }
        }
        .oracle-mouth-talk {
          transform-origin: 50% 50%;
          animation: oracleMouth 280ms ease-in-out infinite;
        }
        @keyframes oracleBob {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-0.6px); }
          100% { transform: translateY(0px); }
        }
        .oracle-bob { animation: oracleBob 1800ms ease-in-out infinite; }
        @keyframes oracleAura {
          0% { opacity: .28; }
          50% { opacity: .6; }
          100% { opacity: .28; }
        }
        .oracle-aura { animation: oracleAura 1800ms ease-in-out infinite; }
      `}</style>
    </div>
  );
}