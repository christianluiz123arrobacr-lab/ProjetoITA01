import { trpcClient } from "@/lib/trpcClient";

export type ContentPageRow = {
  id: string;
  slug: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  description?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ContentBlockItem = {
  title?: string;
  content?: string;
  formula?: string;
  image_url?: string;
};

export type ContentBlockSettings = {
  background?: string;
  icon?: string;
  columns?: number;
  align?: "left" | "center" | "right";
  cardVariant?: string;
};

export type ContentBlockRow = {
  id: string;
  page_id: string;
  type:
    | "section_card"
    | "text_block"
    | "info_box"
    | "highlight_dark"
    | "formula_box"
    | "cards_grid";
  variant?: string | null;
  title?: string | null;
  content?: string | null;
  formula?: string | null;
  image_url?: string | null;
  items_json?: ContentBlockItem[] | null;
  settings_json?: ContentBlockSettings | null;
  order_index: number;
  is_visible: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function getContentPageBySlug(slug: string) {
  return trpcClient.contentPages.getBySlug.query({
    slug,
  }) as Promise<ContentPageRow>;
}

export async function getContentBlocksByPageId(pageId: string) {
  return trpcClient.contentPages.getBlocksByPageId.query({
    pageId,
  }) as Promise<ContentBlockRow[]>;
}

export async function getContentPageWithBlocks(slug: string) {
  return trpcClient.contentPages.getWithBlocks.query({ slug }) as Promise<{
    page: ContentPageRow;
    blocks: ContentBlockRow[];
  }>;
}
