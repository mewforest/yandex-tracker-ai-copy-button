import { SPD_COPY_FORMATTED_DEFAULT, SPD_COPY_FORMATTED_KEY } from "./defaults";
import type { CopyOptions } from "./types";

export function isCopyFormatted(): boolean {
  return GM_getValue(SPD_COPY_FORMATTED_KEY, SPD_COPY_FORMATTED_DEFAULT);
}

export function setCopyFormatted(value: boolean): void {
  GM_setValue(SPD_COPY_FORMATTED_KEY, value);
}

export function getCopyOptions(): CopyOptions {
  return { formatted: isCopyFormatted() };
}
