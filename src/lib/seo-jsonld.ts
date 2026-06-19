import { absoluteSiteUrl } from "./site-url";

const PUBLISHER_NAME = "Radio News Online";

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function publisherBlock(site: URL | undefined) {
  const logo = absoluteSiteUrl(site, "/favicon.png");

  return {
    "@type": "Organization" as const,
    name: PUBLISHER_NAME,
    ...(logo ? { logo: { "@type": "ImageObject" as const, url: logo } } : {}),
  };
}

export function newsArticleJsonLd(options: {
  site: URL | undefined;
  headline: string;
  description: string;
  canonicalPath: string;
  image?: string;
  author?: string;
  datePublished?: Date | string;
  dateModified?: Date | string;
}) {
  const url = absoluteSiteUrl(options.site, options.canonicalPath);
  const image =
    options.image != null
      ? (absoluteSiteUrl(options.site, options.image) ?? options.image)
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: options.headline,
    description: options.description,
    ...(url
      ? {
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }
      : {}),
    ...(image ? { image: [image] } : {}),
    ...(options.datePublished ? { datePublished: toIso(options.datePublished) } : {}),
    ...(options.dateModified ? { dateModified: toIso(options.dateModified) } : {}),
    ...(options.author
      ? { author: { "@type": "Person", name: options.author } }
      : {}),
    publisher: publisherBlock(options.site),
  };
}
