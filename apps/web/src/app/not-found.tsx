import type { Metadata } from "next";
import MessageScreen from "@/components/ui/message-screen";

export const metadata: Metadata = {
  title: "Not found",
};

const NotFound = () => (
  <MessageScreen
    title="We couldn't find that page"
    body="The link may be out of date, or the page may have moved."
    href="/"
    linkLabel="Back to home"
  />
);

export default NotFound;
