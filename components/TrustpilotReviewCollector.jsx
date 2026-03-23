'use client';

import React, { useEffect, useRef } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function TrustpilotReviewCollector() {
  const ref = useRef(null);
  const sectionRef = useRef(null);

  // Parallax for the ambient glow
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.9]);

  // Load Trustpilot widget
  useEffect(() => {
    const loadWidget = () => {
      if (window.Trustpilot && ref.current) {
        try {
          window.Trustpilot.loadFromElement(ref.current, true);
        } catch (e) {
          console.error('Trustpilot widget failed to load:', e);
        }
      }
    };
    loadWidget();
    const timeoutId = setTimeout(loadWidget, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  /* ── Animation variants ── */
  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.3 },
    },
  };

  const starVariant = {
    hidden: { opacity: 0, scale: 0, rotate: -30 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.5 + i * 0.1,
        type: 'spring',
        stiffness: 260,
        damping: 14,
      },
    }),
  };

  const floatUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative scroll-mt-20 border-t border-white/7 bg-[#080808] px-6 py-28 sm:px-10 overflow-hidden"
    >
      {/* ── Ambient Background Effects ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Architectural grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_20%,transparent_100%)]" />

        {/* Primary glow */}
        <motion.div
          style={{ y: glowY, scale: glowScale }}
          className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(0,182,122,0.07)_0%,rgba(91,115,255,0.04)_40%,transparent_70%)] blur-3xl"
        />

        {/* Top / bottom fade */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080808] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#080808] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[720px]">
        {/* ── Title ── */}
        <motion.h2
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 text-center text-[clamp(30px,4.5vw,52px)] font-bold leading-[1.06] tracking-[-0.04em]"
        >
          <span className="block">Gagner la rue.</span>
          <span className="text-[#666]">Gagner la confiance.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mb-16 max-w-md text-center text-[15px] leading-[1.65] text-[#a0a0a0]"
        >
          Seuls de vrais résultats produisent de vrais avis. Découvrez ce que nos clients pensent de notre accompagnement.
        </motion.p>

        {/* ── Main Card ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={floatUp}
          className="group relative"
        >
          {/* Card outer glow on hover */}
          <div className="absolute -inset-px rounded-[24px] bg-gradient-to-b from-[#00b67a]/0 via-[#00b67a]/0 to-[#00b67a]/0 opacity-0 blur-xl transition-all duration-700 group-hover:from-[#00b67a]/10 group-hover:via-transparent group-hover:to-[#5b73ff]/10 group-hover:opacity-100" />

          <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0c0c0c] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_30px_80px_rgba(0,0,0,0.7)] transition-all duration-500 hover:border-white/[0.14]">
            {/* Top accent line */}
            <div className="absolute left-0 right-0 top-0 h-px">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full origin-left bg-gradient-to-r from-transparent via-[#00b67a]/50 to-transparent"
              />
            </div>

            <div className="px-8 py-12 sm:px-14 sm:py-16">
              {/* ── Animated Stars ── */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="mb-8 flex items-center justify-center gap-2"
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={starVariant}
                    whileHover={{
                      scale: 1.25,
                      rotate: 12,
                      transition: { type: 'spring', stiffness: 400, damping: 10 },
                    }}
                    className="relative cursor-pointer"
                  >
                    {/* Star glow */}
                    <div className="absolute inset-0 scale-[2] bg-[#00b67a] opacity-15 blur-xl rounded-full" />
                    <Star className="relative h-9 w-9 fill-[#00b67a] text-[#00b67a] drop-shadow-[0_3px_12px_rgba(0,182,122,0.4)] sm:h-10 sm:w-10" />
                  </motion.div>
                ))}
              </motion.div>


              {/* ── Trustpilot Widget ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="flex w-full min-h-[52px] items-center justify-center"
              >
                <div
                  ref={ref}
                  className="trustpilot-widget w-full flex justify-center"
                  data-locale="fr-CA"
                  data-template-id="56278e9abfbbba0bdcd568bc"
                  data-businessunit-id="69c06a1a5aa851bfa820d684"
                  data-style-height="52px"
                  data-style-width="100%"
                  data-theme="dark"
                  data-token="2054a41c-92c9-40aa-b94d-00d120f886a6"
                >
                  {/* Fallback — Trustpilot branded button */}
                  <a
                    href="https://www.trustpilot.com/review/www.trouvable.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/tp inline-flex items-center gap-3 rounded-full border border-[#00b67a]/20 bg-[#00b67a]/[0.06] px-6 py-3 transition-all duration-300 hover:border-[#00b67a]/40 hover:bg-[#00b67a]/[0.12] hover:shadow-[0_0_30px_rgba(0,182,122,0.1)]"
                  >
                    {/* Trustpilot Star Icon */}
                    <svg viewBox="0 0 30 28" className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 0l4.6 10.8h11.3L21 17.4l4.5 10.8L15 21.5 4.5 28.2 9 17.4 0 10.8h11.3L15 0z" fill="#00b67a"/>
                    </svg>
                    <span className="text-[14px] font-semibold tracking-[-0.01em] text-white/80 transition-colors duration-300 group-hover/tp:text-white">
                      Trustpilot
                    </span>
                    <span className="h-4 w-px bg-white/10" />
                    <span className="text-[13px] font-medium text-white/50 transition-colors duration-300 group-hover/tp:text-white/70">
                      Voir nos avis
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-white/30 transition-all duration-300 group-hover/tp:text-white/50 group-hover/tp:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>


            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
