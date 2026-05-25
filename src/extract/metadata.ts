export interface IssueMetadata {
  project: string;
  goals: string;
  tags: string;
  components: string;
  boards: string;
}

const FIELD_MAP: Record<string, keyof IssueMetadata> = {
  fakemultiproject: "project",
  multiproject: "project",
  multigoal: "goals",
  tags: "tags",
  component: "components",
  boards: "boards",
};

function fieldType(className: string): keyof IssueMetadata | null {
  for (const [token, field] of Object.entries(FIELD_MAP)) {
    if (className.includes(`FieldView_type_${token}`)) return field;
  }
  return null;
}

function parseFieldValue(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return lines[0] ?? "—";
  return lines.slice(1).join(", ") || "—";
}

const EMPTY = "—";

export function extractMetadata(root: ParentNode): IssueMetadata {
  const meta: IssueMetadata = {
    project: EMPTY,
    goals: EMPTY,
    tags: EMPTY,
    components: EMPTY,
    boards: EMPTY,
  };

  const fields = root.querySelectorAll<HTMLElement>(
    ".page-issue__sidebar .FieldView, .FieldView",
  );

  for (const field of fields) {
    const type = fieldType(field.className);
    if (!type) continue;
    const value = parseFieldValue(field.innerText.trim());
    if (value && value !== EMPTY) {
      meta[type] = value;
    }
  }

  return meta;
}
