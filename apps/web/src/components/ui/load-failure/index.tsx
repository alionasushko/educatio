import { ButtonLink } from "@/components/ui/button";
import { ERROR_COPY, type ClientErrorCode } from "@/lib/error-messages";

interface Props {
  title: string;
  code?: ClientErrorCode;
  retryHref: string;
}

const LoadFailure = ({ title, code, retryHref }: Props) => (
  <div className="flex h-full items-center justify-center p-10">
    <div className="max-w-90 text-center">
      <p className="text-text-primary text-base font-medium">{title}</p>
      <p className="text-text-tertiary mt-1 text-sm">
        {ERROR_COPY[code ?? "internal_error"]}
      </p>
      <ButtonLink
        href={retryHref}
        variant="outline"
        size="control"
        className="mt-4"
      >
        Retry
      </ButtonLink>
    </div>
  </div>
);

export default LoadFailure;
