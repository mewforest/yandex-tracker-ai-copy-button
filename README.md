# SPD Tracker — Копировать для ИИ

Tampermonkey / Greasemonkey userscript для [Яндекс Трекера](https://tracker.yandex.ru): добавляет кнопку **«Копировать для ИИ»** рядом со штатными кнопками копирования на странице задачи.

## Доступ к вложениям (XHR)

Скрипт запрашивает файлы через `GM_xmlhttpRequest`. Вложения с Трекера часто редиректят на `storage.mds.yandex.net` — эти домены указаны в `@connect` сборки.

Если в консоли остаётся `Refused to connect` / `not whitelisted URL`:

1. Переустановите скрипт из свежего `dist/spd-tracker-ai-copy.user.js` после `npm run build`.
2. Tampermonkey → настройки скрипта → **XHR Security** → уберите `storage.mds.yandex.net` из blacklist, если он туда попал после отказа.

## Установка

1. Установите [Tampermonkey](https://www.tampermonkey.net/) (или Violentmonkey / Greasemonkey).
2. Соберите скрипт: `npm run build`
3. Откройте `dist/spd-tracker-ai-copy.user.js` и установите в менеджер userscript (или перетащите файл в Tampermonkey).

Для разработки: `npm run dev` — HMR и автоматическое обновление скрипта.

## Что копируется

В буфер попадает Markdown, удобный для вставки в чат с ИИ:

- ключ и название задачи
- ссылка на задачу
- метаданные: проект, связанные цели, теги, компоненты, доски
- описание (YFM → Markdown; картинки — только `![alt](https://…)`)
- вложения: текстовые файлы (json, yaml, md, …) — в code blocks или URL; медиа — URL в Markdown
- комментарии (если есть)

Картинки и другие нетекстовые файлы **не** встраиваются в Markdown как base64. При включённой опции «Копировать нетекстовые вложения» бинарники дополнительно пишутся в системный буфер через `navigator.clipboard` (удобно с Maccy: каждый файл — отдельная запись в истории), затем в буфер попадает текст ТЗ.

## Настройки (меню Tampermonkey)

| Ключ GM | Пункт меню | По умолчанию |
|---------|------------|--------------|
| `SPD_EMBED_TEXT_ATTACHMENTS` | Встраивать текстовые вложения: вкл/выкл | вкл |
| `SPD_COPY_MEDIA_TO_CLIPBOARD` | Копировать нетекстовые вложения: вкл/выкл | вкл |

При первом запуске после обновления значение «встраивать текстовые» берётся из старого `SPD_COPY_FORMATTED`, если новый ключ ещё не задан.

| Опция | Поведение |
|-------|-----------|
| **Встраивать текстовые** вкл | json, yaml, md, txt, … — содержимое в fenced code blocks |
| **Встраивать текстовые** выкл | Только `URL: …` без загрузки тела файла |
| **Копировать нетекстовые** вкл | Медиа (png, inline-картинки, video и т.д.) — в clipboard до текста ТЗ; в Markdown — URL |
| **Копировать нетекстовые** выкл | Медиа только как URL в Markdown, без записей в истории буфера |

После клика: `Скопировано ТЗ` или `Скопировано ТЗ и N медиафайлов` (aria-label кнопки на ~2 с).

## Ручной тест

| URL | Проверка |
|-----|----------|
| https://tracker.yandex.ru/GEB-1 | Markdown без `data:image`; при media вкл — записи в Maccy; активный буфер — текст ТЗ |
| https://tracker.yandex.ru/GEB-2 | короткое описание, png |
| https://tracker.yandex.ru/GEB | задача в side drawer (если включён режим карточки) |

## Скрипты

```bash
npm run dev        # разработка
npm run build      # dist/spd-tracker-ai-copy.user.js
npm run typecheck  # проверка типов
npm run format     # prettier
```
