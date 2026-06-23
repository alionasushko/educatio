import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import Wordmark from "@/components/brand/wordmark";
import CascadeUp from "@/components/motion/cascade-up";

const LandingNav = () => {
  return (
    <CascadeUp delay={0} y={-12}>
      <nav className="mx-auto flex max-w-300 items-center justify-between px-6 py-6 md:px-12">
        <Wordmark size={15} href="/" />
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
            Get started
          </Link>
        </div>
      </nav>
    </CascadeUp>
  );
};

export default LandingNav;
