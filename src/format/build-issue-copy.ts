import type { IssueContext } from "../extract/issue-context";
import type { IssueMetadata } from "../extract/metadata";
import type { CommentBlock } from "../extract/comments";
import type { IssueCopyResult } from "../config/types";
import { extractMetadata } from "../extract/metadata";
import { extractDescription } from "../extract/description";
import { extractAttachments } from "../extract/attachments";
import { extractComments } from "../extract/comments";
import { extractChecklist, type ChecklistItem } from "../extract/checklist";
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

function formatChecklist(items: ChecklistItem[]): string | null {
  if (!items.length) return null;

  const done = items.filter((i) => i.checked).length;
  const lines = items.map(
    (item) => `- [${item.checked ? "x" : " "}] ${item.text}`,
  );

  return [
    "## Чек-лист",
    "",
    `**Выполнено:** ${done}/${items.length}`,
    "",
    ...lines,
  ].join("\n");
}

function buildAiPrompt(ctx: IssueContext): string {
  const lines = [
    "=== ИНСТРУКЦИЯ ДЛЯ АГЕНТА ИИ ===",
    "Ниже вставлена полная копия задачи из Яндекс Трекера в Markdown.",
    "Используй этот блок как источник контекста: текст задачи, описание, чек-лист, вложения и комментарии.",
    `Карточка: ${ctx.key} (${ctx.url})`,
    "",
    "Структура данных ниже:",
    "1) Заголовок задачи и ссылка",
    "2) Метаданные",
    "3) Описание",
    "4) Чек-лист (если есть)",
    "5) Вложения (если есть)",
    "6) Комментарии (если есть)",
    "",
    "КРИТИЧЕСКИ ВАЖНО: ничего не изменяй в Яндекс Трекере. Запрещены любые правки, удаления, статусы, комментарии, переходы с действиями и любые другие модификации.",
    "Если ссылка НЕ является вложением, не переходи по прямым ссылкам в Яндекс Трекер без крайней необходимости.",
    "Если все же пришлось открыть страницу в Яндекс Трекере, НИЧЕГО НИКОГДА не меняй и не удаляй.",
    "",
    "Если ссылка на медиафайл/вложение начинается с https://tracker.yandex.ru/ajax/v2/attachments, при необходимости можно попробовать открыть ее во встроенном браузере IDE (если это возможно), чтобы файл открылся/скачался.",
    "Если файл не открылся и не скачался, считай, что пользователь не авторизован в Яндекс Трекере в IDE; пропусти это и последующие такие действия и явно предупреди пользователя об отсутствии авторизации.",
    "",
    "Дополнительно: пользователь мог вставить часть вложений из задачи (если они вообще есть), поэтому отдельно скачивать некоторые вложения, возможно, не требуется.",
  ];

  return `${lines.join("\n")}\n\n---\n\n`;
}

export async function buildIssueCopy(
  ctx: IssueContext,
): Promise<IssueCopyResult> {
  const options = getCopyOptions();

  const [meta, description, checklist, attachments, comments, mediaItems] =
    await Promise.all([
      Promise.resolve(extractMetadata(ctx.root)),
      extractDescription(ctx.root, ctx.key),
      Promise.resolve(extractChecklist(ctx.root)),
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

  const checklistMd = formatChecklist(checklist);
  if (checklistMd) {
    sections.push("", checklistMd);
  }

  if (attachments) {
    sections.push("", "## Вложения", "", attachments);
  }

  const commentsMd = formatComments(comments);
  if (commentsMd) {
    sections.push("", commentsMd);
  }

  const markdownBody = sections.join("\n").trim() + "\n";
  return {
    markdown: options.addAiPrompt
      ? buildAiPrompt(ctx) + markdownBody
      : markdownBody,
    mediaItems,
  };
}
