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
- описание (YFM → Markdown, inline-изображения как data URI)
- вложения: текстовые файлы (json, yaml, md, …) в code blocks; картинки встроены или с URL
- комментарии (если есть)

## Настройка `SPD_COPY_FORMATTED`

По умолчанию **включена** (хранится в Tampermonkey через `GM_setValue`).

Переключение: меню Tampermonkey → пункт **«Форматированное копирование: вкл/выкл»**.

| Режим | Поведение |
|-------|-----------|
| **Вкл** (default) | Картинки в описании и вложениях — data URI в Markdown; текстовые вложения (json, yaml, md, …) — содержимое в code blocks |
| **Выкл** | Картинки — только `![alt](https://…)`; текстовые вложения — строка `URL: …` без загрузки содержимого |

## Лимиты изображений

- до **2 MB** на одно изображение
- до **10 MB** суммарно на задачу

При превышении в Markdown остаётся URL с пометкой.

## Ручной тест

| URL | Проверка |
|-----|----------|
| https://tracker.yandex.ru/GEB-1 | описание, json + png вложения, inline-картинка |
| https://tracker.yandex.ru/GEB-2 | короткое описание, png |
| https://tracker.yandex.ru/GEB | задача в side drawer (если включён режим карточки) |

После клика по кнопке иконка на ~2 с меняется на галочку (`Скопировано`).

## Скрипты

```bash
npm run dev        # разработка
npm run build      # dist/spd-tracker-ai-copy.user.js
npm run typecheck  # проверка типов
npm run format     # prettier
```
