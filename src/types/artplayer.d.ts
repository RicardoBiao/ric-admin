declare module 'artplayer' {
  interface ArtplayerOption {
    container: HTMLElement;
    url: string;
    title?: string;
    poster?: string;
    volume?: number;
    autoplay?: boolean;
    pip?: boolean;
    setting?: boolean;
    flip?: boolean;
    playbackRate?: boolean;
    aspectRatio?: boolean;
    fullscreen?: boolean;
    fullscreenWeb?: boolean;
    miniProgressBar?: boolean;
    mutex?: boolean;
    backdrop?: boolean;
    playsInline?: boolean;
    autoPlayback?: boolean;
    theme?: string;
    lang?: string;
    customType?: Record<string, (video: HTMLVideoElement, url: string) => void>;
    moreVideoAttr?: Record<string, any>;
  }

  export default class Artplayer {
    constructor(options: ArtplayerOption);
    url: string;
    currentTime: number;
    duration: number;
    paused: boolean;
    destroy(): void;
    on(event: string, callback: () => void): void;
    once(event: string, callback: () => void): void;
  }
}

declare module 'hls.js' {
  export default class Hls {
    static isSupported(): boolean;
    loadSource(url: string): void;
    attachMedia(video: HTMLMediaElement): void;
    destroy(): void;
  }
}
