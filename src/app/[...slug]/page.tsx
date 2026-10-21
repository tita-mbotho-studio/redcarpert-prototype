import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/SiteDocument";
import { sitePages } from "@/data/site";
import { siteMetadata } from "@/data/metadata";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(sitePages)
    .filter((route) => route !== "/")
    .map((route) => ({ slug: route.slice(1).split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = sitePages[`/${slug.join("/")}`];
  return {
    title: document?.title || siteMetadata.title,
    description: document?.description || siteMetadata.description,
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  const document = sitePages[`/${slug.join("/")}`];
  if (!document) notFound();
  return <SiteDocument document={document} />;
}
