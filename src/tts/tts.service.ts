import { Injectable } from '@nestjs/common';
import * as https from 'https';

const CHUNK_SIZE = 2500;

@Injectable()
export class TtsService {
  private apiKey: string;
  private voiceId: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY ?? '';
    this.voiceId = process.env.ELEVENLABS_VOICE_ID ?? '';
  }

  async synthesize(text: string): Promise<Buffer> {
    if (!this.apiKey || !this.voiceId) {
      throw new Error('ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not set');
    }

    const chunks = this.chunkText(text);
    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      buffers.push(await this.callApi(chunk));
    }
    return Buffer.concat(buffers);
  }

  private callApi(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
      });

      const opts: https.RequestOptions = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${this.voiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Accept': 'audio/mpeg',
        },
      };

      const req = https.request(opts, (res) => {
        const parts: Buffer[] = [];
        res.on('data', (d) => parts.push(d));
        res.on('end', () => {
          const buf = Buffer.concat(parts);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`ElevenLabs error ${res.statusCode}: ${buf.toString()}`));
          } else {
            console.log(`TTS chunk done: ${buf.length} bytes`);
            resolve(buf);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private chunkText(text: string): string[] {
    if (text.length <= CHUNK_SIZE) return [text];
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > CHUNK_SIZE) {
      let cutAt = CHUNK_SIZE;
      const newline = remaining.lastIndexOf('\n', CHUNK_SIZE);
      const period = remaining.lastIndexOf('.', CHUNK_SIZE);
      const best = Math.max(newline, period);
      if (best > CHUNK_SIZE * 0.6) cutAt = best + 1;
      chunks.push(remaining.slice(0, cutAt).trim());
      remaining = remaining.slice(cutAt).trim();
    }
    if (remaining.length > 0) chunks.push(remaining);
    return chunks;
  }
}
