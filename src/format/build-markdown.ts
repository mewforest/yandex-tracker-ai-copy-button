import type { IssueContext } from "../extract/issue-context";
import type { IssueMetadata } from "../extract/metadata";
import type { CommentBlock } from "../extract/comments";
import { extractMetadata } from "../extract/metadata";
import { extractDescription } from "../extract/description";
import { extractAttachments } from "../extract/attachments";
import { extractComments } from "../extract/comments";
import { resetImageEmbedBudget } from "../utils/image-embed";

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

export async function buildIssueMarkdown(ctx: IssueContext): Promise<string> {
  resetImageEmbedBudget();

  const [meta, description, attachments, comments] = await Promise.all([
    Promise.resolve(extractMetadata(ctx.root)),
    extractDescription(ctx.root, ctx.key),
    extractAttachments(ctx.root),
    extractComments(ctx.root, ctx.key),
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

  return sections.join("\n").trim() + "\n";
}
