interface Props {
  size?: number;
  className?: string;
}

const EducatioMark = ({ size = 22, className }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 50 C18 46 24 42 30 36"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="2 5"
        opacity="0.45"
      />
      <path
        d="M14 36 L56 10 L46 54 L34 38 Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M34 38 L56 10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default EducatioMark;
