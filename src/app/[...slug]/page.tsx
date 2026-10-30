import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/SiteDocument";
import { sitePages } from "@/data/site";
import { siteMetadata } from "@/data/metadata";
import { catalogueProducts } from "@/data/catalogue";
import { createProductDetailPreview, sampleFittingMessage } from "@/lib/product-detail-preview";
import { isApprovedCapturedRoute, publicStaticRoutes } from "@/lib/public-routes";

const editorialMeta: Record<string, { title: string; description: string }> = {
  "/digital-lookbook": {
    title: "Digital Lookbook | Redcarpert Wedding Dresses",
    description: "Interactive sample bridal lookbook for Mermaid and Ball Gown dresses, with a downloadable PDF.",
  },
  "/our-brides": {
    title: "Our Brides | Redcarpert Wedding Dresses",
    description: "Bridal inspiration gallery using clearly labelled sample photography.",
  },
  "/about-us": {
    title: "About Us | Redcarpert Wedding Dresses",
    description: "Learn about Redcarpert's bridal collections and fitting enquiries.",
  },
  "/contact-us": {
    title: "Contact Us | Redcarpert Wedding Dresses",
    description: "Contact and fitting enquiry information for the Redcarpert prototype.",
  },
};

function documentForRoute(route: string) {
  const product = catalogueProducts.find(p => p.previewRoute === route);
  if (product) {
    if (sitePages[route]) throw new Error(`Sample preview route collides with capture: ${route}`);
    return createProductDetailPreview(sitePages["/product/arabella"], product);
  }
  if (route === "/digital-lookbook") {
    if (sitePages[route]) throw new Error("Lookbook route collides with capture");
    return { ...sitePages["/about-us"], ...editorialMeta[route], route };
  }
  if (!isApprovedCapturedRoute(route)) return undefined;
  const source = sitePages[route];
  if (!source) return undefined;
  return editorialMeta[route] ? { ...source, ...editorialMeta[route] } : source;
}

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return publicStaticRoutes(sitePages, catalogueProducts.map(p => p.previewRoute))
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
