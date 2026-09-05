import type { Metadata } from "next";
import ProfileView from "./profile-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your MK Signatures account settings.",
  openGraph: {
    title: "Profile | MK Signatures",
    description: "Manage your account settings.",
    url: "https://mksignatures.com/profile",
  },
  alternates: {
    canonical: "https://mksignatures.com/profile",
  },
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <div className="bg-secondary py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light">
            My Profile
          </h1>
        </div>
      </div>
      <ProfileView />
    </div>
  );
}
