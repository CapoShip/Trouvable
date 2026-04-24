const HERO_PLATFORM_LABEL = "Google AI Overviews";
const HERO_PLATFORM_MIN_WIDTH_CH = 20;

export default function HeroPlatformWord() {
  return (
    <span
      className="relative inline-flex min-h-[1.24em] align-baseline"
      style={{ minWidth: `${HERO_PLATFORM_MIN_WIDTH_CH}ch` }}
    >
      <span className="inline-block w-full whitespace-nowrap bg-gradient-to-r from-[#5b73ff] via-[#7b8fff] to-[#b79cff] bg-clip-text px-1 py-1 text-center text-transparent">
        {HERO_PLATFORM_LABEL}
      </span>
    </span>
  );
}
