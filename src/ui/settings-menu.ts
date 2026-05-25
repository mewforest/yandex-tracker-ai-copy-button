import { isCopyFormatted, setCopyFormatted } from "../config/settings";

function menuLabel(): string {
  const on = isCopyFormatted();
  return `Форматированное копирование: ${on ? "вкл" : "выкл"}`;
}

export function registerSettingsMenu(): void {
  GM_registerMenuCommand(menuLabel(), () => {
    setCopyFormatted(!isCopyFormatted());
    GM_notification({
      text: menuLabel(),
      timeout: 2000,
    });
  });
}
