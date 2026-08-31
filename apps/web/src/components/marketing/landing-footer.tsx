import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import FadeUp from "@/components/motion/fade-up";

const LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Changelog", href: "/changelog" },
];

const LandingFooter = () => {
  return (
    <FadeUp>
      <footer className="mx-auto flex max-w-300 flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12 md:py-12">
        <div className="flex items-center gap-3.5">
          <Wordmark size={13} />
          <span className="text-text-tertiary text-xs">
            © 2026 Educatio Labs
          </span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="link-muted">
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </FadeUp>
  );
};

export default LandingFooter;
