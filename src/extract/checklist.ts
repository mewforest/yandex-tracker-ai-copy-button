export interface ChecklistItem {
  text: string;
  checked: boolean;
}

export function extractChecklist(root: ParentNode): ChecklistItem[] {
  const items = root.querySelectorAll<HTMLElement>(".ep-checklist-item");
  const result: ChecklistItem[] = [];

  for (const el of items) {
    const text = el
      .querySelector(".ep-checklist-item__text")
      ?.textContent?.trim();
    if (!text) continue;

    result.push({
      text,
      checked: el.classList.contains("ep-checklist-item_checked"),
    });
  }

  return result;
}
