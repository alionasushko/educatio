import { ArrowRightIcon } from "lucide-react";
import Button, { ButtonLink } from "@/components/ui/button";
import ProductPreview from "./product-preview";
import CascadeUp from "@/components/motion/cascade-up";

const HeroSection = () => {
  return (
    <section className="mx-auto grid max-w-300 items-center gap-10 px-6 py-12 pb-20 md:grid-cols-[1fr_1.05fr] md:gap-15 md:px-12 md:pt-15 md:pb-25">
      <div>
        <CascadeUp delay={40}>
          <div className="bg-accent-soft border-accent-soft-border text-accent-brand mb-6 inline-flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-2 text-xs font-medium">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--accent-brand)",
                animation: "edu-pulse-soft 2.4s ease-in-out infinite",
              }}
            />
            Early access · v1
          </div>
        </CascadeUp>

        <CascadeUp delay={140}>
          <h1 className="text-text-primary m-0 text-4xl leading-[1.02] font-semibold tracking-[-0.035em] md:text-6xl lg:text-[64px]">
            The whiteboard your{" "}
            <span className="text-accent-brand">students</span> deserve.
          </h1>
        </CascadeUp>

        <CascadeUp delay={260}>
          <p className="text-text-secondary mt-5 max-w-120 text-base leading-relaxed md:mt-5.5 md:text-lg">
            Educatio is a calm, infinite canvas for one-on-one online tutoring.
            Meet your student on a shared whiteboard — alongside Zoom, Meet, or
            whatever video tool you already use.
          </p>
        </CascadeUp>

        <CascadeUp delay={380}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink
              href="/sign-up"
              size="lg"
              className="h-12 px-5 text-[15px]"
            >
              Get started free
            </ButtonLink>
            <Button variant="ghost" size="lg" className="h-12 px-3 text-[15px]">
              See a sample lesson
              <ArrowRightIcon
                className="size-3.5"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Button>
          </div>
        </CascadeUp>

        <CascadeUp delay={480}>
          <div className="text-text-tertiary mt-4 text-[13px] md:mt-4.5">
            Free forever for solo tutors · No credit card · 90-second setup
          </div>
        </CascadeUp>
      </div>

      <div className="hidden md:block">
        <CascadeUp delay={300} y={20}>
          <div style={{ animation: "edu-float 6.8s ease-in-out infinite" }}>
            <ProductPreview />
          </div>
        </CascadeUp>
      </div>
    </section>
  );
};

export default HeroSection;
