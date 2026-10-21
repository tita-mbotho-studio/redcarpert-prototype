import { SiteDocument } from "@/components/SiteDocument";
import { sitePages } from "@/data/site";

export default function HomePage() {
  return <SiteDocument document={sitePages["/"]} />;
}
