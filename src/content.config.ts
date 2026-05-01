import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const newsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string(),
    category: z.enum([
      "ultima-hora",
      "internacional",
      "nacion",
      "entretenimiento",
      "magazine-cultural",
      "deportes",
      "economia",
      "ciencia",
    ]),
    excerpt: z.string().max(260).optional(),
    author: z.string().default("Redaccion Radio News Online"),
    publishedAt: z.coerce.date(),
    coverImage: z.string(),
    status: z.enum(["draft", "published"]).default("draft"),
  }),
});

export const collections = {
  news: newsCollection,
};
