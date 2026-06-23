import Link from "next/link";
import EducatioMark from "./educatio-mark";

interface Props {
  size?: number;
  href?: string;
  className?: string;
}

const Wordmark = ({ size = 15, href, className = "" }: Props) => {
  const content = (
    <span
      className={`group text-accent-brand inline-flex items-center gap-2 ${className}`}
    >
      <span
        className="inline-flex transition-transform duration-360"
        style={{
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <span className="inline-flex transition-transform duration-360 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.75 group-hover:-translate-y-px group-hover:-rotate-3">
          <EducatioMark size={size + 4} />
        </span>
      </span>
      <span
        className="text-text-primary font-semibold"
        style={{ fontSize: size, letterSpacing: "-0.015em" }}
      >
        Educatio
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="no-underline">
      {content}
    </Link>
  ) : (
    content
  );
};

export default Wordmark;
