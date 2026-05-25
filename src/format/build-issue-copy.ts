import type { IssueContext } from "../extract/issue-context";
import type { IssueMetadata } from "../extract/metadata";
import type { CommentBlock } from "../extract/comments";
import type { IssueCopyResult } from "../config/types";
import { extractMetadata } from "../extract/metadata";
import { extractDescription } from "../extract/description";
import { extractAttachments } from "../extract/attachments";
import { extractComments } from "../extract/comments";
import { collectMediaItems } from "../extract/media-items";
import { getCopyOptions } from "../config/settings";

function formatMetadata(meta: IssueMetadata): string {
  return [
    "## Метаданные",
    `- **Проект:** ${meta.project}`,
    `- **Связанные цели:** ${meta.goals}`,
    `- **Теги:** ${meta.tags}`,
    `- **Компоненты:** ${meta.components}`,
    `- **Доски:** ${meta.boards}`,
  ].join("\n");
}

function formatComments(comments: CommentBlock[]): string | null {
  if (!comments.length) return null;
  const parts = comments.map((c) => {
    const header = c.date ? `### ${c.author} — ${c.date}` : `### ${c.author}`;
    return `${header}\n\n${c.body}`;
  });
  return ["## Комментарии", "", ...parts].join("\n");
}

export async function buildIssueCopy(
  ctx: IssueContext,
): Promise<IssueCopyResult> {
  const options = getCopyOptions();

  const [meta, description, attachments, comments, mediaItems] =
    await Promise.all([
      Promise.resolve(extractMetadata(ctx.root)),
      extractDescription(ctx.root, ctx.key),
      extractAttachments(ctx.root, options),
      extractComments(ctx.root, ctx.key, options),
      collectMediaItems(ctx.root, ctx.key, options),
    ]);

  const sections = [
    `# ${ctx.key}: ${ctx.title}`,
    "",
    `**Ссылка:** ${ctx.url}`,
    "",
    formatMetadata(meta),
    "",
    "## Описание",
    "",
    description,
  ];

  if (attachments) {
    sections.push("", "## Вложения", "", attachments);
  }

  const commentsMd = formatComments(comments);
  if (commentsMd) {
    sections.push("", commentsMd);
  }

  return {
    markdown: sections.join("\n").trim() + "\n",
    mediaItems,
  };
}
