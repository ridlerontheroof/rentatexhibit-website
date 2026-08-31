import { config } from "./generated";
export interface SeoMeta { name?: string; property?: string; content: string }
export interface SeoModel { title: string; canonical: string; metas: SeoMeta[]; jsonLd: object[] }
export interface SeoOptions { title?: string; description?: string }
export function buildSeoModel(path: string, options: SeoOptions = {}): SeoModel {
  const title = `${options.title || config.property.name} ${config.seo.defaultTitleSuffix}`;
  const description = options.description || config.seo.defaultDescription;
  const canonical = `${config.identity.canonicalOrigin.replace(/\/$/, "")}${path}`;
  return { title, canonical, metas: [{ name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }], jsonLd: [] };
}