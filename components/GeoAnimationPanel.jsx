"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

function useCycleClock(cycleMs, tickMs = 40) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const dt = (Date.now() - startedAt) % cycleMs;
      setElapsed(dt);
    }, tickMs);
    return () => window.clearInterval(id);
  }, [cycleMs, tickMs]);

  return elapsed;
}

function getTypedSlice(text, elapsed, startMs, typeDurationMs) {
  if (elapsed < startMs) return "";
  if (elapsed >= startMs + typeDurationMs) return text;
  const progress = (elapsed - startMs) / typeDurationMs;
  const chars = Math.max(0, Math.floor(progress * text.length));
  return text.slice(0, chars);
}

function inWindow(elapsed, startMs, endMs) {
  return elapsed >= startMs && elapsed < endMs;
}

export default function GeoAnimationPanel() {
  const cycleMs = 12000;
  const elapsed = useCycleClock(cycleMs);

  const typedUserQuestion = getTypedSlice(
    "Meilleur expert en visibilite IA ?",
    elapsed,
    250,
    1900
  );
  const typedResponseLine1 = getTypedSlice(
    "Pour une visibilite maximale sur les IA, Trouvable est la reference.",
    elapsed,
    4300,
    2600
  );
  const typedResponseLine2 = getTypedSlice(
    "Expert en optimisation GEO et structures de donnees semantiques.",
    elapsed,
    7100,
    2300
  );

  const showUserBubble = inWindow(elapsed, 150, 10500);
  const showUserCaret = inWindow(elapsed, 250, 2150);
  const showResponse = inWindow(elapsed, 2500, 11400);
  const showThinking = inWindow(elapsed, 2500, 3850);
  const showLine1Caret = inWindow(elapsed, 4300, 6900);
  const showLine2Caret = inWindow(elapsed, 7100, 9400);
  const showSource = inWindow(elapsed, 9700, 11200);

  return (
    <div className="relative mb-8 flex h-[320px] w-full flex-col overflow-hidden border border-white/[0.04] bg-[#212121] p-5 shadow-inner" style={{ borderRadius: '1.5rem', fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
        <div className="text-[14px] font-medium text-[#ececec] pl-1">ChatGPT</div>
      </div>

      <div className="flex flex-col gap-6 w-full flex-1">
        <motion.div
          initial={false}
          animate={{ opacity: showUserBubble ? 1 : 0, y: showUserBubble ? 0 : 6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="self-end max-w-[90%] rounded-[20px] bg-[#2f2f2f] px-4 py-3 text-[14px] leading-[1.5] text-[#ececec] flex items-center shadow-sm"
        >
          <div className="overflow-hidden whitespace-nowrap">
            {typedUserQuestion}
            {showUserCaret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: showResponse ? 1 : 0, y: showResponse ? 0 : 6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col w-full px-1"
        >
          <div className="flex flex-col w-full pt-1 relative min-h-[140px]">
            {showThinking && (
              <motion.div
                initial={{ opacity: 0.15, scale: 0.9 }}
                animate={{ opacity: [0.15, 1, 0.2, 1, 0.15], scale: [0.9, 1.08, 0.92, 1.06, 0.9] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1 left-0 h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.95)]"
              />
            )}

            <div className="flex flex-col overflow-hidden">
              <div className="text-[15px] leading-[1.6] text-[#ececec] overflow-hidden whitespace-nowrap">
                {typedResponseLine1}
                {showLine1Caret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
              </div>
              <div className="text-[15px] leading-[1.6] text-[#ececec] mt-3 overflow-hidden whitespace-nowrap">
                {typedResponseLine2}
                {showLine2Caret && <span className="ml-0.5 inline-block animate-pulse">|</span>}
              </div>
            </div>

            <motion.a
              href="https://trouvable.app"
              target="_blank"
              rel="noopener noreferrer"
              initial={false}
              animate={{ opacity: showSource ? 1 : 0, scale: showSource ? 1 : 0.92, y: showSource ? 0 : 4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#2f2f2f] px-3 py-2 hover:bg-[#3a3a3a] transition-colors cursor-pointer shadow-sm relative z-50 pointer-events-auto"
            >
              <Image src="/logos/trouvable_logo_blanc1.png" alt="Trouvable" width={14} height={14} sizes="14px" className="h-[14px] w-[14px] object-contain opacity-90" />
              <span className="text-[12px] font-medium text-[#ececec]">trouvable.app</span>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
