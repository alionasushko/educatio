import Eyebrow from "@/components/ui/eyebrow";
import FadeUp from "@/components/motion/fade-up";

const CreateIllo = () => {
  return (
    <div className="absolute inset-0 p-5">
      <div
        className="border-border-subtle bg-surface h-full rounded-lg border p-3.5"
        style={{ boxShadow: "var(--shadow-subtle)" }}
      >
        <div className="text-text-tertiary text-[10px] font-semibold tracking-[0.08em] uppercase">
          Lesson title
        </div>
        <div className="text-text-primary mt-1 text-[13px] font-medium">
          Spanish with Sara · Week 4
        </div>
        <div className="border-border-subtle bg-bg mt-3 h-6 rounded-[5px] border" />
        <div className="bg-accent-brand mt-3 ml-auto h-6 w-20 rounded-[5px]" />
      </div>
    </div>
  );
};

const ShareIllo = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div
        className="border-border-subtle bg-surface w-full rounded-lg border p-3"
        style={{ boxShadow: "var(--shadow-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <div className="border-border-subtle bg-bg text-text-primary flex h-7 flex-1 items-center rounded-[5px] border px-2.5 font-mono text-[11px]">
            educatio.app/join/k7v-z9q
          </div>
          <div className="bg-accent-brand flex h-7 items-center rounded-[5px] px-2.5 text-[11px] font-medium text-white">
            Copy
          </div>
        </div>
        <div className="text-text-tertiary mt-2 text-[10px]">
          Send to your student — no account needed.
        </div>
      </div>
    </div>
  );
};

const TeachIllo = () => {
  return (
    <div
      className="absolute inset-0 p-3.5"
      style={{
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklab, var(--text-tertiary) 28%, transparent) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }}
    >
      <div
        className="absolute top-5.5 left-5 w-17.5 rounded-[3px] px-2 py-1.5 text-[10px] font-semibold"
        style={{
          background: "var(--sticky-yellow)",
          transform: "rotate(-4deg)",
        }}
      >
        ayer
        <div
          className="text-[8px] italic opacity-60"
          style={{ fontWeight: 400 }}
        >
          yesterday
        </div>
      </div>
      <div
        className="absolute top-9 right-5 w-17.5 rounded-[3px] px-2 py-1.5 text-[10px] font-semibold"
        style={{
          background: "var(--sticky-blue)",
          transform: "rotate(4deg)",
        }}
      >
        siempre
        <div
          className="text-[8px] italic opacity-60"
          style={{ fontWeight: 400 }}
        >
          always
        </div>
      </div>
      <div className="font-hand text-text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[22px] font-medium">
        Pretérito vs Imperfecto
      </div>
      <div className="absolute right-3.5 bottom-3 inline-flex">
        <span className="bg-accent-brand border-bg inline-flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] text-[7px] font-semibold text-white">
          LR
        </span>
        <span className="bg-accent-rust border-bg -ml-1.25 inline-flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] text-[7px] font-semibold text-white">
          SM
        </span>
      </div>
    </div>
  );
};

const STEPS = [
  {
    num: "01",
    title: "Create a lesson",
    body: "Give it a title — “Algebra · Week 3” — and optionally drop in a Zoom or Meet link.",
    illo: <CreateIllo />,
  },
  {
    num: "02",
    title: "Share the link",
    body: "Your student opens it, types their name, and they're in. No account, no install.",
    illo: <ShareIllo />,
  },
  {
    num: "03",
    title: "Teach together",
    body: "Draw, write, drop notes, paste code. When the lesson ends, you both get a clean summary.",
    illo: <TeachIllo />,
  },
] as const;

const STAGGER = [120, 240, 360];

const HowItWorksSection = () => {
  return (
    <section>
      <div className="mx-auto max-w-300 px-6 py-16 md:px-12 md:py-24">
        <FadeUp>
          <div className="mb-14 flex flex-col items-baseline justify-between gap-6 md:flex-row md:gap-8">
            <div>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="mt-3 text-3xl leading-[1.15] font-semibold tracking-tight md:text-4xl">
                From &ldquo;let&rsquo;s meet&rdquo; to teaching, in under a
                minute.
              </h2>
            </div>
            <p className="text-text-secondary m-0 max-w-85 text-[15px] leading-[1.55]">
              No tutorial. No setup wizard. Just a link to share with your
              student.
            </p>
          </div>
        </FadeUp>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <FadeUp key={s.num} delay={STAGGER[i]} className="h-full">
              <div className="edu-hover border-border-subtle bg-surface h-full rounded-[14px] border p-7">
                <div className="border-border-subtle bg-bg relative mb-5 h-40 overflow-hidden rounded-[10px] border">
                  {s.illo}
                </div>
                <div className="text-text-tertiary font-mono text-xs tracking-wider">
                  STEP {s.num}
                </div>
                <h3 className="mt-1.5 mb-1.5 text-lg font-semibold tracking-[-0.015em]">
                  {s.title}
                </h3>
                <p className="text-text-secondary m-0 text-sm leading-[1.55]">
                  {s.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
