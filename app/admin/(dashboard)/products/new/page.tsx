import type { Metadata } from "next";
import NewProductView from "./new-product-view";

export const metadata: Metadata = {
  title: "New Product",
};

export default function NewProductPage() {
  return <NewProductView />;
}
