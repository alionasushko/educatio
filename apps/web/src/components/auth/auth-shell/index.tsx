import Link from "next/link";
import Wordmark from "@/components/brand/wordmark";
import CascadeUp from "@/components/motion/cascade-up";

interface Props {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthShell = ({ children, footer }: Props) => {
  return (
    <div className="bg-bg flex min-h-dvh w-full flex-col items-center">
      <header className="flex w-full shrink-0 items-center px-6 pt-8 md:px-12">
        <Wordmark href="/" size={15} />
      </header>

      <main className="flex w-full flex-1 items-center justify-center px-6 py-8 md:px-8">
        <div className="w-100 max-w-full">
          <CascadeUp delay={60} y={18}>
            {children}
          </CascadeUp>
        </div>
      </main>

      <footer className="text-text-tertiary px-6 pt-6 pb-8 text-center text-[12.5px] md:px-12">
        {footer ?? (
          <>
            <Link href="#" className="link-muted">
              Privacy
            </Link>
            <span className="mx-2 opacity-50">·</span>
            <Link href="#" className="link-muted">
              Terms
            </Link>
          </>
        )}
      </footer>
    </div>
  );
};

export default AuthShell;
