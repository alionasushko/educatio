interface Props {
  children: string;
}

const EmailAddress = ({ children }: Props) => (
  <span className="text-text-primary font-medium wrap-anywhere">
    {children}
  </span>
);

export default EmailAddress;
