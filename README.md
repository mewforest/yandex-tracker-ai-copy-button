<div align="center">

# Yandex Tracker - AI Copy Button

[![Install from Greasy Fork](https://img.shields.io/static/v1?label=Install&message=Greasy%20Fork&logoColor=white&labelColor=3D0000&color=670000&style=for-the-badge)](https://greasyfork.org/ru/scripts/581250-yandex-tracker-ai-copy-button)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://github.com/mewforest/yandex-tracker-ai-copy-button/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/mewforest/yandex-tracker-ai-copy-button?style=for-the-badge&label=Release)](https://github.com/mewforest/yandex-tracker-ai-copy-button/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-00485B?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://www.tampermonkey.net/)

</div>

Расширение в формате userscript-а для [Яндекс Трекера](https://tracker.yandex.ru): добавляет кнопку **«Копировать для ИИ»** рядом со штатными кнопками копирования на странице задачи. Позволяет параллельно копировать вложения комментарии и все необходимые метаданные задачи. Работает сразу из коробки, API-токены не требуются.

<img width="4096" height="2024" alt="annotely_image" src="https://github.com/user-attachments/assets/1de29cf3-5670-4769-b4ff-16c928d75adb" />

## Установка

**Рекомендуемый способ:** нажмите кнопку **Install from Greasy Fork** вверху README или откройте [страницу скрипта на Greasy Fork](https://greasyfork.org/ru/scripts/581250-yandex-tracker-ai-copy-button) и установите одним кликом.

Альтернативный вариант:

1. Установите [Tampermonkey](https://www.tampermonkey.net/) (или альтернативы Violentmonkey / Greasemonkey — в них скрипт не тестировался).
2. Скачайте готовый юзерскрипт из [релизов GitHub](https://github.com/mewforest/yandex-tracker-ai-copy-button/releases) или соберите самостоятельно: `npm run build` (итоговый файл будет в папке `dist`).
3. Перетащите файл `yandex-tracker-ai-copy-button.user.js` в браузер и установите через менеджер userscript-ов (например, в окно расширения Tampermonkey).

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

## Возможные проблемы

### Работа под Safari

Работает стабильно на официальном Tampermonkey (расширение в AppStore платное), но копирование нескольких вложений за раз не работает (расширенный Clipboard API). Расширение для юзерскриптов Safari Userscripts (quoid/userscripts) также не поддерживается из-за ограничений api.

### Возможные проблемы: доступ к вложениям (XHR)

> Проблему на практике почти не встречал, но она может возникнуть (в теории).

Скрипт запрашивает файлы через `GM_xmlhttpRequest`. Вложения с Трекера обычно редиректят на `storage.mds.yandex.net` — эти домены указаны в `@connect` сборки.

Но если в консоли остаётся `Refused to connect` / `not whitelisted URL`:

1. Если появился такой пункт в TamperMonkey у юзер-скрипта, то нажать "Добавить в исключения".
2. Переустановите скрипт из свежих релизов или мастер-ветки (`dist/yandex-tracker-ai-copy-button.user.js` после `npm run build`) и перезапустить браузер.
2. Опционально: Tampermonkey → настройки скрипта → **XHR Security** → убрать `storage.mds.yandex.net` из blacklist (если он туда попал после отказа).
