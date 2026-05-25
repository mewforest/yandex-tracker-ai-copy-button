# SPD Tracker — Копировать для ИИ

Tampermonkey / Greasemonkey userscript для [Яндекс Трекера](https://tracker.yandex.ru): добавляет кнопку **«Копировать для ИИ»** рядом со штатными кнопками копирования на странице задачи.

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
