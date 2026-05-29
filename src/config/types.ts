export interface CopyOptions {
  embedTextAttachments: boolean;
  copyMediaToClipboard: boolean;
  addAiPrompt: boolean;
}

export interface IssueCopyResult {
  markdown: string;
  mediaItems: MediaItem[];
}

export interface MediaItem {
  url: string;
  name: string;
}
