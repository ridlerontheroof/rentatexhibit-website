import { metadataForPage, SiteShell } from "./site-components";
import { pageByPath } from "./site-data";

const homePage = pageByPath("/")!;

export const metadata = metadataForPage(homePage);

export default function Home() {
  return <SiteShell page={homePage} />;
}
