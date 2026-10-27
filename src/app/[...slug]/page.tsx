import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/SiteDocument";
import { sitePages } from "@/data/site";
import { siteMetadata } from "@/data/metadata";
import { catalogueProducts } from "@/data/catalogue";
import { createProductDetailPreview, sampleFittingMessage } from "@/lib/product-detail-preview";

function documentForRoute(route: string) {
  const product = catalogueProducts.find(p => p.previewRoute === route);
  if (!product) return sitePages[route];
  if (sitePages[route]) throw new Error(`Sample preview route collides with capture: ${route}`);
  return createProductDetailPreview(sitePages["/product/arabella"], product);
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [...Object.keys(sitePages), ...catalogueProducts.map(p => p.previewRoute)]
    .filter((route) => route !== "/")
    .map((route) => ({ slug: route.slice(1).split("/") }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = documentForRoute(`/${slug.join("/")}`);
  return {
    title: document?.title || siteMetadata.title,
    description: document?.description || siteMetadata.description,
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  const route = `/${slug.join("/")}`;
  const document = documentForRoute(route);
  if (!document) notFound();
  const product = catalogueProducts.find(p => p.previewRoute === route);
  return <SiteDocument document={document} enquiryMessage={product ? sampleFittingMessage(product) : undefined} />;
}
