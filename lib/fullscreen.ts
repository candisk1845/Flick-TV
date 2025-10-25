// Enhanced fullscreen API with cross-browser support

export class FullscreenAPI {
  static isSupported(): boolean {
    return !!(
      document.fullscreenEnabled ||
      (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement !== undefined ||
      (document as Document & { mozFullScreenElement?: Element }).mozFullScreenElement !== undefined ||
      (document as Document & { msFullscreenElement?: Element }).msFullscreenElement !== undefined
    );
  }

  static isFullscreen(): boolean {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      mozFullScreenElement?: Element;
      msFullscreenElement?: Element;
    };
    
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  }

  static async requestFullscreen(element: HTMLElement): Promise<void> {
    const el = element as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
      } else {
        throw new Error('Fullscreen API not supported');
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      throw error;
    }
  }

  static async exitFullscreen(): Promise<void> {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };
    
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      } else {
        throw new Error('Exit fullscreen API not supported');
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
      throw error;
    }
  }

  static async toggle(element: HTMLElement): Promise<boolean> {
    try {
      if (this.isFullscreen()) {
        await this.exitFullscreen();
        return false;
      } else {
        await this.requestFullscreen(element);
        return true;
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
      return this.isFullscreen();
    }
  }

  // Video-specific fullscreen for iOS Safari
  static enterVideoFullscreen(video: HTMLVideoElement): void {
    const videoEl = video as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
    };
    
    try {
      if (videoEl.webkitEnterFullscreen) {
        videoEl.webkitEnterFullscreen();
      } else {
        throw new Error('Video fullscreen not supported');
      }
    } catch (error) {
      console.error('Failed to enter video fullscreen:', error);
    }
  }

  static exitVideoFullscreen(video: HTMLVideoElement): void {
    const videoEl = video as HTMLVideoElement & {
      webkitExitFullscreen?: () => void;
    };
    
    try {
      if (videoEl.webkitExitFullscreen) {
        videoEl.webkitExitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit video fullscreen:', error);
    }
  }

  // Event listeners for fullscreen changes
  static onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
    const handleChange = () => {
      callback(this.isFullscreen());
    };

    // Add all possible event listeners
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);
    document.addEventListener('MSFullscreenChange', handleChange);

    // Return cleanup function
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('MSFullscreenChange', handleChange);
    };
  }
}