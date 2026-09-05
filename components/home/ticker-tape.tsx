"use client";

const TICKER_ITEMS = [
  "Free Delivery on Orders Above ₦100,000",
  "New Arrivals Weekly",
  "Quality You Can Trust",
  "Shop With Confidence",
];

export default function TickerTape() {
  return (
    <div className="overflow-hidden border-b border-border bg-black py-2.5 sm:py-3">
      <div className="ticker-track flex whitespace-nowrap">
        {/* Render a single set repeated four times for a seamless loop */}
        {[0, 1].map((set) => (
          <div key={set} className="flex shrink-0">
            {TICKER_ITEMS.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-6 px-6 text-[10px] font-medium uppercase tracking-[0.2em] text-white/80 sm:gap-8 sm:px-8 sm:text-xs"
              >
                {item}
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
