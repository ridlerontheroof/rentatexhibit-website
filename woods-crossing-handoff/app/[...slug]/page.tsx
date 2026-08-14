import { notFound } from "next/navigation";
import { metadataForPage, SiteShell } from "../site-components";
import { pageByPath } from "../site-data";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

function pathFromSlug(slug: string[]) {
  return `/${slug.join("/")}`;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = pageByPath(pathFromSlug(slug));
  if (!page) return {};
  return metadataForPage(page);
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = pageByPath(pathFromSlug(slug));
  if (!page) notFound();
  return <SiteShell page={page} />;
}
