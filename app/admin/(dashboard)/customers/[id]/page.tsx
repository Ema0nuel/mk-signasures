import type { Metadata } from "next";
import CustomerDetailView from "./customer-detail-view";

export const metadata: Metadata = {
  title: "Customer Details",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}
