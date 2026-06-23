import {
  UsersIcon,
  MessageSquareTextIcon,
  MonitorPlayIcon,
} from "lucide-react";
import Eyebrow from "@/components/ui/eyebrow";
import FadeUp from "@/components/motion/fade-up";

const FEATURES = [
  {
    icon: <UsersIcon className="size-5" strokeWidth={1.7} aria-hidden="true" />,
    title: "Real-time collaboration",
    body: "Student and tutor draw, write, and share on the same canvas live. See each other's cursors, never wait for a refresh.",
  },
  {
    icon: (
      <MessageSquareTextIcon
        className="size-5"
        strokeWidth={1.7}
        aria-hidden="true"
      />
    ),
    title: "AI lesson summaries",
    body: "Every lesson ends with a clean, shareable summary — ready to email, download as PDF, or paste into a parent's inbox.",
  },
  {
    icon: (
      <MonitorPlayIcon
        className="size-5"
        strokeWidth={1.7}
        aria-hidden="true"
      />
    ),
    title: "Works with your video tool",
    body: "Keep using Zoom, Meet, or whatever you've got. Educatio sits alongside — it doesn't try to replace your face-to-face.",
  },
] as const;

const STAGGER = [120, 220, 320];

const FeaturesSection = () => {
  return (
    <section className="border-border-subtle bg-surface border-y">
      <div className="mx-auto max-w-300 px-6 py-16 md:px-12 md:py-22">
        <FadeUp>
          <Eyebrow>Built for tutoring</Eyebrow>
          <h2 className="mt-3 max-w-160 text-3xl leading-[1.15] font-semibold tracking-tight md:text-4xl">
            Everything you need for a focused{" "}
            <span className="whitespace-nowrap">1-on-1</span> lesson. Nothing
            else.
          </h2>
        </FadeUp>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={STAGGER[i]} className="h-full">
              <div className="edu-hover border-border-subtle bg-bg h-full rounded-xl border p-7">
                <div className="border-border-subtle bg-surface text-accent-brand mb-4.5 flex h-10 w-10 items-center justify-center rounded-[10px] border">
                  {f.icon}
                </div>
                <h3 className="m-0 text-[17px] font-semibold tracking-[-0.015em]">
                  {f.title}
                </h3>
                <p className="text-text-secondary mt-1.5 text-sm leading-[1.55]">
                  {f.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
