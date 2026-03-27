"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ContactButton from "@/components/ContactButton";
import { CheckCircle2 } from "lucide-react";

/* ─── PALETTE & DATA ─── */
const A = { blue: "#5b73ff", purple: "#a78bfa", emerald: "#34d399" };

const PLATFORMS = [
  "Google Search",
  "Google AI Overviews",
  "ChatGPT",
  "Gemini",
  "Claude",
  "Perplexity",
  "Copilot",
  "Grok",
];

/* ═══════════════════════════════════════════════════════════════
   AURORA CANVAS
   Luminous orbiting gradient orbs with additive blending,
   smooth intensity interpolation (with bloom overshoot),
   bokeh motes, and a precision ring.
   ═══════════════════════════════════════════════════════════════ */

function AuroraCanvas({ intensity = 0 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const targetRef = useRef(intensity);
  const smoothRef = useRef(0);

  useEffect(() => { targetRef.current = intensity; }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* Gradient orbs — large, soft, orbiting */
    const orbs = [
      { cx: 0.48, cy: 0.40, r: 320, c: [91,115,255],  a: 0.22, or: 55,  sp: 0.28, ph: 0,   pu: 0.38 },
      { cx: 0.56, cy: 0.46, r: 270, c: [167,139,250], a: 0.16, or: 75,  sp: 0.40, ph: 2.1, pu: 0.32 },
      { cx: 0.40, cy: 0.52, r: 200, c: [52,211,153],   a: 0.10, or: 48, sp: 0.48, ph: 4.2, pu: 0.28 },
      { cx: 0.50, cy: 0.36, r: 400, c: [45,65,180],    a: 0.08, or: 95, sp: 0.22, ph: 1.0, pu: 0.22 },
      { cx: 0.53, cy: 0.44, r: 140, c: [130,145,255],  a: 0.16, or: 32, sp: 0.55, ph: 3.5, pu: 0.45 },
      { cx: 0.37, cy: 0.56, r: 250, c: [120,90,220],   a: 0.08, or: 68, sp: 0.32, ph: 5.0, pu: 0.25 },
    ];

    /* Bokeh motes — large, soft, drifting */
    const bokeh = Array.from({ length: 6 }, (_, i) => ({
      x: 0.2 + Math.random() * 0.6,
      y: 0.25 + Math.random() * 0.5,
      r: 30 + Math.random() * 55,
      c: i % 3 === 0 ? [91,115,255] : i % 3 === 1 ? [167,139,250] : [52,211,153],
      a: 0.025 + Math.random() * 0.035,
      dx: (Math.random() - 0.5) * 0.00004,
      dy: (Math.random() - 0.5) * 0.00003,
      ps: 0.15 + Math.random() * 0.2,
      pp: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      const { width: w, height: h } = p.getBoundingClientRect();
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    const t0 = Date.now();

    const draw = () => {
      const p = canvas.parentElement;
      if (!p) { animRef.current = requestAnimationFrame(draw); return; }
      const { width: w, height: h } = p.getBoundingClientRect();
      const t = (Date.now() - t0) / 1000;

      /* Smooth intensity interpolation — faster ramp-up, slower settle */
      const target = targetRef.current;
      const factor = smoothRef.current < target ? 0.04 : 0.025;
      smoothRef.current += (target - smoothRef.current) * factor;
      const I = smoothRef.current;

      ctx.clearRect(0, 0, w, h);

      /* ── Additive blending for luminous aurora ── */
      ctx.globalCompositeOperation = "lighter";

      for (const o of orbs) {
        const angle = t * o.sp + o.ph;
        const x = w * o.cx + Math.cos(angle) * o.or;
        const y = h * o.cy + Math.sin(angle * 0.7) * o.or * 0.6;
        const pulse = Math.sin(t * o.pu + o.ph) * 0.3 + 0.7;
        const alpha = o.a * pulse * I;
        if (alpha < 0.002) continue;

        const g = ctx.createRadialGradient(x, y, 0, x, y, o.r);
        g.addColorStop(0,    `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${alpha})`);
        g.addColorStop(0.35, `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${alpha * 0.45})`);
        g.addColorStop(0.7,  `rgba(${o.c[0]},${o.c[1]},${o.c[2]},${alpha * 0.1})`);
        g.addColorStop(1,    `rgba(${o.c[0]},${o.c[1]},${o.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      for (const b of bokeh) {
        b.x += b.dx; b.y += b.dy;
        if (b.x < 0.1 || b.x > 0.9) b.dx *= -1;
        if (b.y < 0.2 || b.y > 0.8) b.dy *= -1;
        const bPulse = Math.sin(t * b.ps + b.pp) * 0.5 + 0.5;
        const bAlpha = b.a * bPulse * I;
        if (bAlpha < 0.002) continue;
        const bx = w * b.x, by = h * b.y;
        const bg = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        bg.addColorStop(0,   `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${bAlpha})`);
        bg.addColorStop(0.5, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${bAlpha * 0.25})`);
        bg.addColorStop(1,   `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`);
        ctx.fillStyle = bg;
        ctx.fillRect(bx - b.r, by - b.r, b.r * 2, b.r * 2);
      }

      /* ── Precision ring — subtle instrument aesthetic ── */
      ctx.globalCompositeOperation = "source-over";

      if (I > 0.3) {
        const cx = w / 2, cy = h * 0.48;
        const ringR = Math.min(w, h) * 0.22;
        const ringAlpha = Math.min(0.06, (I - 0.3) * 0.09);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.06);
        ctx.setLineDash([4, 14]);
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(91, 115, 255, ${ringAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.setLineDash([]);

        /* Second arc — partial, counter-rotating */
        ctx.rotate(-t * 0.12);
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 1.35, -0.4, Math.PI * 0.7);
        ctx.strokeStyle = `rgba(167, 139, 250, ${ringAlpha * 0.6})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" />;
}

/* ═══════════════════════════════════════════
   CYCLING WORD — Platform name rotator
   ═══════════════════════════════════════════ */

function CyclingWord() {
  const [index, setIndex] = useState(0);
  const longest = PLATFORMS.reduce((a, b) => (a.length >= b.length ? a : b));

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % PLATFORMS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative inline-block max-w-full align-baseline" aria-live="polite" aria-atomic="true">
      <span className="invisible block select-none whitespace-nowrap leading-[1.08]" aria-hidden="true">{longest}</span>
      <span className="absolute inset-0 overflow-hidden">
        {PLATFORMS.map((word, i) => (
          <motion.span
            key={word}
            className="absolute inset-x-0 top-0 flex h-full items-center justify-center whitespace-nowrap bg-gradient-to-r from-[#5b73ff] via-[#8b7aef] to-[#a78bfa] bg-clip-text text-transparent will-change-transform"
            initial={false}
            animate={{
              y: i === index ? 0 : i === (index - 1 + PLATFORMS.length) % PLATFORMS.length ? "-115%" : "115%",
              opacity: i === index ? 1 : 0,
              filter: i === index ? "blur(0px)" : "blur(6px)",
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════
   HERO CINEMATIC — Main export
   ═══════════════════════════════════════════ */

export default function HeroCinematic() {
  const [stage, setStage] = useState(0);
  const [noMotion, setNoMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setNoMotion(true);
      setStage(4);
      return;
    }
    const timers = [
      setTimeout(() => setStage(1), 150),   // Horizon + aurora begins
      setTimeout(() => setStage(2), 1100),  // Aurora warming
      setTimeout(() => setStage(3), 2100),  // BLOOM — typography reveals
      setTimeout(() => setStage(4), 4000),  // Settled
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  /* Aurora: ramp → bloom overshoot → settle */
  const auroraTarget = noMotion ? 1 : [0, 0.22, 0.6, 1.35, 1.0][stage] ?? 1.0;

  const ready = noMotion || stage >= 3;

  /* ─── Framer variants ─── */
  const lineReveal = (d = 0) => ({
    hidden: { opacity: 0, y: 34, filter: "blur(10px)" },
    visible: {
      opacity: 1, y: 0, filter: "blur(0px)",
      transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: d },
    },
  });

  const fadeUp = (d = 0) => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: d },
    },
  });

  const fadeSoft = (d = 0) => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, delay: d } },
  });

  return (
    <section
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 pt-[58px]"
      aria-label="Trouvable — visibilité opérée"
    >
      {/* ─── Background ─── */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#080808]" />

      {/* ─── Film grain — analog premium texture ─── */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
        aria-hidden="true"
      />

      {/* ─── Aurora light field ─── */}
      {!noMotion && <AuroraCanvas intensity={auroraTarget} />}

      {/* ─── Static fallback for reduced-motion ─── */}
      {noMotion && (
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(91,115,255,0.1)_0%,rgba(167,139,250,0.04)_40%,transparent_70%)]" />
      )}

      {/* ─── Horizon line — the signature ─── */}
      <motion.div
        className="pointer-events-none absolute left-0 right-0 z-[2]"
        style={{ top: "48%" }}
        initial={noMotion ? false : { scaleX: 0, opacity: 0 }}
        animate={stage >= 1 ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="mx-auto h-px w-[85%] max-w-[1200px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${A.blue}30 15%, ${A.blue}50 35%, ${A.purple}40 50%, ${A.emerald}30 65%, ${A.blue}30 85%, transparent 100%)`,
          }}
        />
        <div
          className="mx-auto -mt-5 h-10 w-[60%] max-w-[800px]"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(91,115,255,0.20) 0%, transparent 100%)",
          }}
        />
      </motion.div>

      {/* ─── Content ─── */}
      <div className="relative z-10 mx-auto flex w-full max-w-[920px] flex-col items-center text-center">
        {/* Overline badge */}
        <motion.div
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 backdrop-blur-[2px]"
          initial={noMotion ? false : "hidden"}
          animate={ready ? "visible" : "hidden"}
          variants={fadeSoft(0)}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#34d399]" />
          </span>
          Firme de visibilité opérée
        </motion.div>

        {/* Headline — line-by-line reveal */}
        <h1 className="text-[clamp(40px,7vw,86px)] font-bold leading-[1.04] tracking-[-0.045em]">
          <motion.span
            className="block text-white"
            initial={noMotion ? false : "hidden"}
            animate={ready ? "visible" : "hidden"}
            variants={lineReveal(0)}
          >
            Nous opérons votre
          </motion.span>
          <motion.span
            className="block text-white"
            initial={noMotion ? false : "hidden"}
            animate={ready ? "visible" : "hidden"}
            variants={lineReveal(0.15)}
          >
            visibilité sur
          </motion.span>
          <motion.span
            className="mt-1 block sm:mt-2"
            initial={noMotion ? false : "hidden"}
            animate={ready ? "visible" : "hidden"}
            variants={lineReveal(0.3)}
          >
            <CyclingWord />
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          className="mx-auto mb-10 mt-8 max-w-[600px] text-[17px] leading-[1.7] text-[#999]"
          initial={noMotion ? false : "hidden"}
          animate={ready ? "visible" : "hidden"}
          variants={fadeUp(0.5)}
        >
          Nous prenons en charge le travail sur votre signal public&nbsp;: clarté
          locale, cohérence face aux systèmes conversationnels, livrables
          vérifiables. Vous déléguez, nous exécutons.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={noMotion ? false : "hidden"}
          animate={ready ? "visible" : "hidden"}
          variants={fadeUp(0.65)}
        >
          <ContactButton className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e0e0e0] hover:shadow-[0_8px_30px_rgba(255,255,255,0.08)]">
            Demander une cartographie
          </ContactButton>
          <Link
            href="/offres"
            className="rounded-lg border border-white/[0.12] px-7 py-3.5 text-sm font-medium text-[#a0a0a0] transition hover:-translate-y-px hover:border-white/25 hover:text-white"
          >
            Voir les mandats &rarr;
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-white/30"
          initial={noMotion ? false : "hidden"}
          animate={ready ? "visible" : "hidden"}
          variants={fadeSoft(0.9)}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/60" /> Prise en charge complète
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/60" /> Expertise humaine
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400/60" /> Méthodologie éprouvée
          </span>
        </motion.div>
      </div>

      {/* ─── Scroll hint ─── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={noMotion ? false : { opacity: 0 }}
        animate={stage >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="h-8 w-5 rounded-full border border-white/15" aria-hidden="true">
          <motion.div
            className="mx-auto mt-1.5 h-2 w-1 rounded-full bg-white/30"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
