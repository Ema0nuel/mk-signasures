import AdminProviders from "@/components/admin/admin-providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProviders>{children}</AdminProviders>;
}
