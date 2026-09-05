import type { Metadata } from "next";
import CategoryDetailView from "./category-detail-view";

export const metadata: Metadata = {
  title: "Category",
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryDetailView categoryId={id} />;
}
