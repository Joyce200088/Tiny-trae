// TTS (Text-to-Speech) utility library with cooldown and audio management
import { useState } from 'react';

export interface TTSOptions {
  language?: string;
  voice?: 'male' | 'female' | 'child';
  speed?: number;
  pitch?: number;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  metadata?: {
    text: string;
    language: string;
    voice: string;
    speed: number;
    pitch: number;
    duration: number;
    format: string;
  };
  error?: string;
  cacheKey?: string;
}

class TTSManager {
  private audioCache = new Map<string, HTMLAudioElement>();
  private cooldownMap = new Map<string, number>();
  private readonly COOLDOWN_DURATION = 2000; // 2 seconds cooldown
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Check if TTS is available in the current environment
   */
  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'Audio' in window;
  }

  /**
   * Check if a text is currently in cooldown
   */
  isInCooldown(text: string): boolean {
    const lastPlayTime = this.cooldownMap.get(text);
    if (!lastPlayTime) return false;
    
    return Date.now() - lastPlayTime < this.COOLDOWN_DURATION;
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  getCooldownRemaining(text: string): number {
    const lastPlayTime = this.cooldownMap.get(text);
    if (!lastPlayTime) return 0;
    
    const remaining = this.COOLDOWN_DURATION - (Date.now() - lastPlayTime);
    return Math.max(0, remaining);
  }

  /**
   * Stop currently playing audio
   */
  stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Generate speech from text using the API
   */
  async generateSpeech(text: string, options: TTSOptions = {}): Promise<TTSResponse> {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          language: options.language || 'en-US',
          voice: options.voice || 'female',
          speed: options.speed || 1.0,
          pitch: options.pitch || 1.0,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'TTS request failed');
      }

      return data;
    } catch (error) {
      console.error('TTS generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Play text using TTS with cooldown protection
   */
  async speak(text: string, options: TTSOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('TTS not available in this environment');
      return false;
    }

    // Check cooldown
    if (this.isInCooldown(text)) {
      const remaining = this.getCooldownRemaining(text);
      console.log(`TTS cooldown active. ${remaining}ms remaining.`);
      return false;
    }

    // Stop any currently playing audio
    this.stopCurrent();

    try {
      // Check cache first
      const cacheKey = `${text}-${JSON.stringify(options)}`;
      let audio = this.audioCache.get(cacheKey);

      if (!audio) {
        // Generate new speech
        const ttsResponse = await this.generateSpeech(text, options);
        
        if (!ttsResponse.success || !ttsResponse.audioUrl) {
          throw new Error(ttsResponse.error || 'Failed to generate speech');
        }

        // Create audio element
        audio = new Audio(ttsResponse.audioUrl);
        
        // Cache the audio
        this.audioCache.set(cacheKey, audio);
        
        // Limit cache size
        if (this.audioCache.size > 50) {
          const firstKey = this.audioCache.keys().next().value;
          if (firstKey) {
            this.audioCache.delete(firstKey);
          }
        }
      }

      // Set up audio event handlers
      return new Promise((resolve) => {
        if (!audio) {
          resolve(false);
          return;
        }

        const onEnded = () => {
          this.currentAudio = null;
          audio!.removeEventListener('ended', onEnded);
          audio!.removeEventListener('error', onError);
          resolve(true);
        };

        const onError = (error: Event) => {
          console.error('Audio playback error:', error);
          this.currentAudio = null;
          audio!.removeEventListener('ended', onEnded);
          audio!.removeEventListener('error', onError);
          resolve(false);
        };

        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        // Play audio
        this.currentAudio = audio;
        audio.currentTime = 0;
        
        audio.play().then(() => {
          // Set cooldown
          this.cooldownMap.set(text, Date.now());
        }).catch((error) => {
          console.error('Failed to play audio:', error);
          onError(error);
        });
      });

    } catch (error) {
      console.error('TTS speak error:', error);
      return false;
    }
  }

  /**
   * Preload speech for faster playback
   */
  async preload(text: string, options: TTSOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = `${text}-${JSON.stringify(options)}`;
      
      if (this.audioCache.has(cacheKey)) {
        return true; // Already cached
      }

      const ttsResponse = await this.generateSpeech(text, options);
      
      if (!ttsResponse.success || !ttsResponse.audioUrl) {
        return false;
      }

      const audio = new Audio(ttsResponse.audioUrl);
      this.audioCache.set(cacheKey, audio);
      
      return true;
    } catch (error) {
      console.error('TTS preload error:', error);
      return false;
    }
  }

  /**
   * Clear audio cache
   */
  clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.audioCache.size,
      keys: Array.from(this.audioCache.keys())
    };
  }
}

// Export singleton instance
export const ttsManager = new TTSManager();

// Convenience functions
export const speak = (text: string, options?: TTSOptions) => 
  ttsManager.speak(text, options);

export const preloadSpeech = (text: string, options?: TTSOptions) => 
  ttsManager.preload(text, options);

export const stopSpeech = () => ttsManager.stopCurrent();

export const isTTSAvailable = () => ttsManager.isAvailable();

export const getTTSCooldown = (text: string) => 
  ttsManager.getCooldownRemaining(text);

// React hook for TTS functionality
export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speakText = async (text: string, options?: TTSOptions) => {
    setError(null);
    setIsPlaying(true);
    
    try {
      const success = await ttsManager.speak(text, options);
      if (!success) {
        setError('Failed to play speech');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsPlaying(false);
    }
  };

  const stopSpeaking = () => {
    ttsManager.stopCurrent();
    setIsPlaying(false);
  };

  return {
    speak: speakText,
    stop: stopSpeaking,
    isPlaying,
    error,
    isAvailable: ttsManager.isAvailable(),
    getCooldown: ttsManager.getCooldownRemaining.bind(ttsManager)
  };
}