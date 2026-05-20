import { Injectable } from '@nestjs/common';
import * as https from 'https';

const CHUNK_SIZE = 2500;
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

@Injectable()
export class TtsService {
  private apiKey: string;
  private voiceId: string;

  constructor() {
    this.apiKey = process.env.GENMAX_API_KEY ?? '';
    this.voiceId = process.env.MINIMAX_VOICE_ID ?? '';
  }

  async synthesize(text: string): Promise<Buffer> {
    if (!this.apiKey || !this.voiceId) {
      throw new Error('GENMAX_API_KEY or MINIMAX_VOICE_ID not set');
    }

    const chunks = this.chunkText(text);
    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      buffers.push(await this.callApi(chunk));
    }
    return Buffer.concat(buffers);
  }

  private async callApi(text: string): Promise<Buffer> {
    const body = JSON.stringify({
      text,
      model_id: 'speech-2.8-turbo',
      provider: 'minimax',
      language_code: 'Vietnamese',
      voice_settings: { speed: 1.0, pitch: 0, vol: 1.0 },
    });

    const { statusCode, contentType, buf } = await this.httpRequest({
      hostname: 'api.genmax.io',
      path: `/v1/text-to-speech/${this.voiceId}`,
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Accept: 'audio/mpeg',
      },
      body,
    });

    if (statusCode && statusCode >= 400) {
      throw new Error(`GenMax TTS error ${statusCode}: ${buf.toString()}`);
    }

    if (contentType.includes('audio')) {
      console.log(`TTS chunk done: ${buf.length} bytes`);
      return buf;
    }

    // Async job response
    let json: { id?: string; status?: string; audio_url?: string };
    try {
      json = JSON.parse(buf.toString());
    } catch {
      throw new Error(`GenMax TTS unexpected response: ${buf.toString()}`);
    }

    if (!json.id) {
      throw new Error(`GenMax TTS unexpected response: ${buf.toString()}`);
    }

    console.log(`TTS job queued: ${json.id}, polling...`);
    return this.pollJob(json.id);
  }

  private async pollJob(jobId: string): Promise<Buffer> {
    for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const { statusCode, buf } = await this.httpRequest({
        hostname: 'api.genmax.io',
        path: `/v1/history/${jobId}`,
        method: 'GET',
        headers: { 'xi-api-key': this.apiKey, Accept: 'application/json' },
      });

      if (statusCode && statusCode >= 400) {
        throw new Error(`GenMax poll error ${statusCode}: ${buf.toString()}`);
      }

      let json: { status?: string; progress?: number; result?: { audio_url?: string } } = {};
      try {
        json = JSON.parse(buf.toString());
      } catch {
        // ignore, keep polling
      }

      console.log(`TTS job ${jobId} status: ${json.status} progress: ${json.progress ?? 0} (attempt ${attempt})`);

      if (json.status === 'completed' || json.status === 'done') {
        const audioUrl = json.result?.audio_url;
        if (audioUrl) {
          console.log(`TTS job done, downloading audio...`);
          return this.downloadUrl(audioUrl);
        }
        throw new Error(`GenMax job completed but no audio_url in response`);
      }

      if (json.status === 'failed' || json.status === 'error') {
        throw new Error(`GenMax TTS job failed: ${buf.toString()}`);
      }
    }

    throw new Error(`GenMax TTS job ${jobId} timed out after ${POLL_MAX_ATTEMPTS} attempts`);
  }

  private downloadUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        const parts: Buffer[] = [];
        res.on('data', (d) => parts.push(d));
        res.on('end', () => resolve(Buffer.concat(parts)));
      }).on('error', reject);
    });
  }

  private httpRequest(opts: {
    hostname: string;
    path: string;
    method: string;
    headers: Record<string, string | number>;
    body?: string;
  }): Promise<{ statusCode: number | undefined; contentType: string; buf: Buffer }> {
    return new Promise((resolve, reject) => {
      const req = https.request(opts, (res) => {
        const parts: Buffer[] = [];
        res.on('data', (d) => parts.push(d));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            contentType: (res.headers['content-type'] as string) ?? '',
            buf: Buffer.concat(parts),
          });
        });
      });
      req.on('error', reject);
      if (opts.body) req.write(opts.body);
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
