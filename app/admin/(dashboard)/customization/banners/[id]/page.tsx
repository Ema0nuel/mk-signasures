import BannerEditorView from "./banner-editor-view";

export default async function BannerEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BannerEditorView bannerId={id} />;
}
