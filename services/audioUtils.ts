// Utility to base64 decode and create audio buffers
export class AudioController {
  private context: AudioContext;
  private gainNode: GainNode;
  private currentSource: AudioBufferSourceNode | null = null;
  private isUnlocked = false;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, // Gemini TTS often returns 24kHz
    });
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  // Browsers require user interaction to unlock AudioContext
  public async unlock() {
    if (this.isUnlocked) return;
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.isUnlocked = true;
  }

  public async decodeAudioData(base64String: string): Promise<AudioBuffer> {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // We must copy the buffer because decodeAudioData detaches it
    const bufferCopy = bytes.buffer.slice(0); 
    
    // Note: Gemini returns raw PCM in some contexts (Live API) but the TTS model 
    // usually returns encapsulated audio depending on the request. 
    // However, the standard `gemini-2.5-flash-preview-tts` documentation 
    // implies we receive raw data if we don't specify container, 
    // BUT `AudioContext.decodeAudioData` usually expects a file header (WAV/MP3).
    // The provided examples in the prompt for TTS use a custom `decodeAudioData` for raw PCM.
    // Let's implement the RAW PCM decoder as per the prompt instructions 
    // to be safe for Gemini 2.5 Flash TTS which returns raw PCM.
    
    return this.decodeRawPCM(bytes, 24000, 1);
  }
  
  private decodeRawPCM(data: Uint8Array, sampleRate: number, numChannels: number): AudioBuffer {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = this.context.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  public playBuffer(buffer: AudioBuffer, onEnded: () => void) {
    // Stop any currently playing source
    this.stop();

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.onended = onEnded;
    source.start(0);
    this.currentSource = source;
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }
  }

  public setVolume(val: number) {
    this.gainNode.gain.value = val;
  }
}

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data URI prefix (e.g. "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
