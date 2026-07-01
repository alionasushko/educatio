"use client";

import { useTransition } from "react";
import Button from "@/components/ui/button";

const SignOutButton = () => {
  const [pending, startTransition] = useTransition();

  const signOut = () =>
    startTransition(async () => {
      try {
        await fetch("/auth/signout", { method: "POST" });
      } catch (error) {
        console.error("sign-out request failed", error);
      }
      window.location.assign("/");
    });

  return (
    <Button variant="ghost" onClick={signOut} disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
};

export default SignOutButton;
