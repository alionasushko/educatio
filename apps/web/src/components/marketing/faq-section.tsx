"use client";

import Accordion from "@/components/ui/accordion";
import AccordionItem from "@/components/ui/accordion-item";
import AccordionTrigger from "@/components/ui/accordion-trigger";
import AccordionContent from "@/components/ui/accordion-content";
import Eyebrow from "@/components/ui/eyebrow";
import FadeUp from "@/components/motion/fade-up";

const FAQ_ITEMS = [
  {
    id: "free",
    q: "Is Educatio actually free?",
    a: "Yes. Educatio v1 is free forever for solo tutors with unlimited lessons. We'll introduce a paid plan later for teams and schools — your free account will keep working.",
  },
  {
    id: "video",
    q: "Do I have to use a specific video tool?",
    a: "No. Educatio doesn't do video — it sits alongside whatever you already use. Paste your Zoom or Meet link when you create the lesson and your student can launch the call from inside Educatio.",
  },
  {
    id: "account",
    q: "Does my student need an account?",
    a: "No. They open the lesson link, type their name, and they're in. Accounts are only for tutors.",
  },
  {
    id: "after",
    q: "What happens to the canvas after a lesson?",
    a: "It's saved to your dashboard. You and your student get an AI-generated summary you can export as PDF, text, or email.",
  },
  {
    id: "privacy",
    q: "Is my lesson data private?",
    a: "Yes. Lessons are private to you and your student. We never use lesson content for advertising and never share it with anyone outside your session.",
  },
  {
    id: "tablet",
    q: "Will Educatio work on a tablet?",
    a: "Yes — tablet is fully supported for both tutor and student. On phones, lessons open in a clean read-only view so students can review past sessions.",
  },
] as const;

const FaqSection = () => {
  return (
    <section className="border-border-subtle bg-surface border-y">
      <div className="mx-auto max-w-220 px-6 py-16 md:px-12 md:py-22">
        <FadeUp>
          <div className="mb-12 text-center">
            <Eyebrow className="inline-block">Questions</Eyebrow>
            <h2 className="mt-3 text-[28px] leading-[1.15] font-semibold tracking-tight md:text-[32px]">
              Frequently asked.
            </h2>
          </div>
        </FadeUp>

        <FadeUp delay={100}>
          <Accordion
            defaultValue={[FAQ_ITEMS[0].id]}
            className="border-border-subtle bg-bg overflow-hidden rounded-xl border"
          >
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-border-subtle hover:bg-accent-tint px-5 transition-colors duration-150 ease-out"
              >
                <AccordionTrigger className="text-text-primary py-4 text-[15px] font-medium tracking-[-0.005em] hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-text-secondary max-w-160 text-sm leading-[1.6]">
                    {item.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeUp>
      </div>
    </section>
  );
};

export default FaqSection;
