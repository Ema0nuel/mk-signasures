import type { Metadata } from "next";
import ResetPasswordClient from "./reset-password-client";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set your new MK Signasures password.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            Reset Password
          </h1>
        </div>
      </div>
      <ResetPasswordClient />
    </div>
  );
}
