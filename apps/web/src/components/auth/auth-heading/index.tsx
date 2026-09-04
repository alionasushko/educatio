interface Props {
  title: string;
  children: React.ReactNode;
}

const AuthHeading = ({ title, children }: Props) => (
  <>
    <h1 className="text-text-primary text-[22px] font-semibold tracking-[-0.02em]">
      {title}
    </h1>
    <p className="text-text-secondary mt-2 mb-6 text-sm leading-normal">
      {children}
    </p>
  </>
);

export default AuthHeading;
