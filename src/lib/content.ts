import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Card, CardCategory, CardFrontmatter } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

let cache: Card[] | null = null;

function readAll(): Card[] {
  if (cache) return cache;
  const cards: Card[] = [];
  if (!fs.existsSync(CONTENT_DIR)) return [];

  for (const category of fs.readdirSync(CONTENT_DIR)) {
    const dir = path.join(CONTENT_DIR, category);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as CardFrontmatter;
      cards.push({
        slug: file.replace(/\.md$/, ""),
        title: fm.title,
        category: (fm.category ?? category) as CardCategory,
        stack: fm.stack ?? [],
        tags: fm.tags ?? [],
        excerpt: fm.excerpt ?? "",
        related: fm.related ?? [],
        updated: fm.updated,
        body: content.trim(),
      });
    }
  }
  cards.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  cache = cards;
  return cards;
}

export function getAllCards(): Card[] {
  return readAll();
}

export function getCard(slug: string): Card | undefined {
  return readAll().find((c) => c.slug === slug);
}

export function getCardsByCategory(category: CardCategory): Card[] {
  return readAll().filter((c) => c.category === category);
}

export function getCategoriesWithCards(): { category: CardCategory; cards: Card[] }[] {
  const groups = new Map<CardCategory, Card[]>();
  for (const c of readAll()) {
    if (!groups.has(c.category)) groups.set(c.category, []);
    groups.get(c.category)!.push(c);
  }
  return Array.from(groups.entries()).map(([category, cards]) => ({ category, cards }));
}
