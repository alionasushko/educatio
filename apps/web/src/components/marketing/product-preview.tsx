import Wordmark from "@/components/brand/wordmark";

interface MiniStickyProps {
  color: string;
  x: number;
  y: number;
  rot: number;
  title: string;
  sub: string;
}

const MiniSticky = ({ color, x, y, rot, title, sub }: MiniStickyProps) => {
  return (
    <div
      className="absolute w-21.5 rounded-[3px] px-2.5 py-2 text-[11px] font-semibold tracking-[-0.01em]"
      style={{
        left: x,
        top: y,
        background: color,
        transform: `rotate(${rot}deg)`,
        boxShadow: "0 2px 6px rgba(0,0,0,.08)",
        color: "rgba(0,0,0,.78)",
      }}
    >
      {title}
      <div
        className="mt-px text-[9px] italic"
        style={{ color: "rgba(0,0,0,.5)", fontWeight: 400 }}
      >
        {sub}
      </div>
    </div>
  );
};

const ProductPreview = () => {
  return (
    <div
      aria-hidden="true"
      className="relative"
      style={{
        transform: "perspective(1400px) rotateY(-7deg) rotateX(2deg)",
        transformOrigin: "left center",
      }}
    >
      <div
        className="border-border-subtle bg-surface overflow-hidden rounded-[14px] border"
        style={{
          boxShadow:
            "0 30px 80px -20px rgba(28,25,23,.18), 0 12px 24px -10px rgba(28,25,23,.10)",
        }}
      >
        {/* Mini topbar */}
        <div className="border-border-subtle bg-surface flex items-center gap-2 border-b px-3.5 py-2.5">
          <Wordmark size={11} />
          <span className="bg-border-subtle mx-1 h-3.5 w-px" />
          <span className="text-text-primary text-xs font-semibold">
            Spanish with Sara · Week 4
          </span>
          <span className="text-text-tertiary text-[11px]">with Sara M.</span>
          <span className="flex-1" />
          <span className="text-success inline-flex items-center gap-1 text-[10.5px] font-medium">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--success)",
                boxShadow:
                  "0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent)",
              }}
            />
            Live
          </span>
          <span className="inline-flex">
            <span className="bg-accent-brand border-surface inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border-[1.5px] text-[8px] font-semibold text-white">
              LR
            </span>
            <span className="bg-accent-rust border-surface -ml-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border-[1.5px] text-[8px] font-semibold text-white">
              SM
            </span>
          </span>
        </div>

        {/* Canvas area */}
        <div
          className="relative h-95"
          style={{
            background: "var(--bg)",
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklab, var(--text-tertiary) 22%, transparent) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <div className="absolute top-8 right-9 left-9">
            <div className="text-text-primary text-[26px] font-semibold tracking-tight">
              Pretérito{" "}
              <span className="text-text-tertiary font-normal">vs</span>{" "}
              Imperfecto
            </div>
            <div className="text-text-secondary mt-1 text-[11px]">
              Two past tenses, one decision.
            </div>
          </div>

          <div className="border-border-subtle bg-surface absolute top-27 left-9 w-50 rounded-[6px] border px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="bg-accent-rust h-1.5 w-1.5 rounded-[6px]" />
              <span className="text-[11px] font-semibold">Pretérito</span>
              <span className="text-text-tertiary text-[9px]">completed</span>
            </div>
            <div className="text-text-secondary mt-1.5 text-[10.5px] leading-[1.4]">
              Ayer estudié dos horas.
            </div>
          </div>
          <div className="border-border-subtle bg-surface absolute top-27 left-62 w-50 rounded-[6px] border px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="bg-accent-brand h-1.5 w-1.5 rounded-[6px]" />
              <span className="text-[11px] font-semibold">Imperfecto</span>
              <span className="text-text-tertiary text-[9px]">ongoing</span>
            </div>
            <div className="text-text-secondary mt-1.5 text-[10.5px] leading-[1.4]">
              Estudiaba todos los días.
            </div>
          </div>

          <MiniSticky
            color="var(--sticky-yellow)"
            x={462}
            y={50}
            rot={-4}
            title="ayer"
            sub="yesterday"
          />
          <MiniSticky
            color="var(--sticky-blue)"
            x={272}
            y={232}
            rot={3}
            title="mientras"
            sub="while"
          />
          <MiniSticky
            color="var(--sticky-pink)"
            x={36}
            y={250}
            rot={-3}
            title="siempre"
            sub="always"
          />
          <MiniSticky
            color="var(--sticky-green)"
            x={462}
            y={250}
            rot={4}
            title="de repente"
            sub="suddenly"
          />

          {/* Live cursor */}
          <div className="absolute top-70 left-80">
            <svg
              width="14"
              height="16"
              viewBox="0 0 22 24"
              className="text-accent-rust"
            >
              <path
                d="M2 2 L2 18 L7 14 L10 21 L13 20 L10 13 L17 13 Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            <span className="bg-accent-rust absolute top-3 left-3 rounded-[3px] px-1.5 py-px text-[9px] font-semibold tracking-[0.02em] text-white">
              Sara
            </span>
          </div>

          {/* Mini toolbar */}
          <div
            className="border-border-subtle bg-surface absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-lg border p-1"
            style={{ boxShadow: "var(--shadow-medium)" }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-[5px]"
                style={{
                  background: i === 3 ? "var(--accent-brand)" : "transparent",
                  color: i === 3 ? "white" : "var(--text-secondary)",
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{
                    background: "currentColor",
                    opacity: i === 3 ? 1 : 0.6,
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
