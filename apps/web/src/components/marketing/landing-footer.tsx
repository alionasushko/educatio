import Wordmark from "@/components/brand/wordmark";
import FadeUp from "@/components/motion/fade-up";

const LandingFooter = () => {
  return (
    <FadeUp>
      <footer className="mx-auto flex max-w-300 flex-col items-center justify-center gap-6 px-6 py-10 md:flex-row md:px-12 md:py-12">
        <div className="flex items-center gap-3.5">
          <Wordmark size={13} />
          <span className="text-text-tertiary text-xs">
            © 2026 Educatio Labs
          </span>
        </div>
      </footer>
    </FadeUp>
  );
};

export default LandingFooter;
