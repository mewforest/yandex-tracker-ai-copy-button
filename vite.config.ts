import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Yandex Tracker - AI Copy Button',
        namespace: 'yandex-tracker-ai-copy-button',
        version: '1.0.0',
        description:
          'Добавляет кнопку копирования задачи Яндекс Трекера в Markdown для ИИ',
        license: 'MIT',
        match: ['https://tracker.yandex.ru/*'],
        connect: [
          'tracker.yandex.ru',
          'api.tracker.yandex.net',
          'storage.mds.yandex.net',
          's3.mds.yandex.net',
          '*.mds.yandex.net',
          '*.yandex.net',
        ],
        grant: [
          'GM_xmlhttpRequest',
          'GM_setClipboard',
          'GM_getValue',
          'GM_setValue',
          'GM_registerMenuCommand',
          'GM_notification',
        ],
        'run-at': 'document-idle',
      },
      build: {
        fileName: 'yandex-tracker-ai-copy-button.user.js',
      },
    }),
  ],
});
