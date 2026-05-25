import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'SPD Tracker — Копировать для ИИ',
        namespace: 'spd-tracker-ai-copy',
        version: '1.0.0',
        description:
          'Добавляет кнопку копирования задачи Яндекс Трекера в Markdown для ИИ',
        author: 'SPD',
        match: ['https://tracker.yandex.ru/*'],
        connect: ['tracker.yandex.ru'],
        grant: ['GM_xmlhttpRequest', 'GM_setClipboard'],
        'run-at': 'document-idle',
      },
      build: {
        fileName: 'spd-tracker-ai-copy.user.js',
      },
    }),
  ],
});
