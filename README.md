# Yandex Tracker - AI Copy Button

Tampermonkey / Greasemonkey userscript для [Яндекс Трекера](https://tracker.yandex.ru): добавляет кнопку **«Копировать для ИИ»** рядом со штатными кнопками копирования на странице задачи.

<img width="3128" height="1546" alt="image_2026-05-29_18-02-03" src="https://github.com/user-attachments/assets/95f9dbdd-b044-4bb0-a54f-09f8c6010ff2" />

## Доступ к вложениям (XHR)

Скрипт запрашивает файлы через `GM_xmlhttpRequest`. Вложения с Трекера часто редиректят на `storage.mds.yandex.net` — эти домены указаны в `@connect` сборки.

Если в консоли остаётся `Refused to connect` / `not whitelisted URL`:

1. Переустановите скрипт из свежего `dist/yandex-tracker-ai-copy-button.user.js` после `npm run build`.
2. Tampermonkey → настройки скрипта → **XHR Security** → уберите `storage.mds.yandex.net` из blacklist, если он туда попал после отказа.

## Установка

1. Установите [Tampermonkey](https://www.tampermonkey.net/) (или Violentmonkey / Greasemonkey).
2. Соберите скрипт: `npm run build`
3. Откройте `dist/yandex-tracker-ai-copy-button.user.js` и установите в менеджер userscript (или перетащите файл в Tampermonkey).

Для разработки: `npm run dev` — HMR и автоматическое обновление скрипта.

## Что копируется

В буфер попадает Markdown, удобный для вставки в чат с ИИ:

- ключ и название задачи
- ссылка на задачу
- метаданные: проект, связанные цели, теги, компоненты, доски
- описание (YFM → Markdown; картинки — только `![alt](https://…)`)
- чек-лист (если есть): пункты с `- [x]` / `- [ ]` и счётчик выполненных
- вложения: текстовые файлы (json, yaml, md, …) — в code blocks или URL; медиа — URL в Markdown
- комментарии (если есть)

При включённой опции «Копировать медиа (медленно)» бинарники дополнительно пишутся в системный буфер через `navigator.clipboard` (удобно с Maccy: каждый файл — отдельная запись в истории), затем в буфер попадает текст ТЗ.

## Настройки (меню Tampermonkey)

| Ключ GM                       | Пункт меню                              | По умолчанию |
| ----------------------------- | --------------------------------------- | ------------ |
| `EMBED_TEXT_ATTACHMENTS`      | Встраивать текстовые вложения: вкл/выкл | вкл          |
| `COPY_MEDIA_TO_CLIPBOARD`     | Копировать медиа (медленно): вкл/выкл   | выкл         |
| `ADD_AI_PROMPT`               | Добавлять промпт: вкл/выкл              | вкл          |

| Опция                                | Поведение                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| **Встраивать текстовые** вкл         | json, yaml, md, txt, … — содержимое в fenced code blocks                                   |
| **Встраивать текстовые** выкл        | Только `URL: …` без загрузки тела файла                                                    |
| **Копировать медиа (медленно)** вкл  | Медиа (png, inline-картинки, video и т.д.) — в clipboard до текста ТЗ; в Markdown — URL    |
| **Копировать медиа (медленно)** выкл | Медиа только как URL в Markdown, без записей в истории буфера                              |
| **Добавлять промпт** вкл             | В начале копии добавляется служебный русскоязычный промпт для ИИ с правилами использования |
| **Добавлять промпт** выкл            | Копируется только Markdown задачи без служебного префикса                                  |

После клика: `Скопировано ТЗ` или `Скопировано ТЗ и N медиафайлов` (aria-label кнопки на ~2 с).

## Скрипты

```bash
npm run dev        # разработка
npm run build      # dist/yandex-tracker-ai-copy-button.user.js
npm run typecheck  # проверка типов
npm run format     # prettier
```

## Релизы через GitHub Actions

В репозитории настроен workflow `.github/workflows/release.yml`.

Что делает pipeline:

- запускается на push тега формата `v*` (например, `v1.2.0`) или вручную через `workflow_dispatch`
- выполняет `npm ci`
- выполняет `npm run typecheck`
- собирает userscript через `npm run build`
- публикует `dist/yandex-tracker-ai-copy-button.user.js` как asset в GitHub Release
