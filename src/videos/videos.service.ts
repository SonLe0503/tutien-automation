import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class VideosService {
  private readonly templateDir = path.join(process.cwd(), 'src', 'videos', 'templates', 'health-short');
  private readonly buildBaseDir = path.join(process.cwd(), 'src', 'videos', 'builds');
  private readonly outputDir = path.join(process.cwd(), 'output');
  private readonly assetsMusicDir = path.join(process.cwd(), 'src', 'videos', 'assets', 'music');

  constructor() {
    fs.mkdirSync(this.buildBaseDir, { recursive: true });
    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.mkdirSync(this.assetsMusicDir, { recursive: true });
  }

  /**
   * Generates a 9:16 vertical short video from TTS audio and script content.
   */
  async generateShortVideo(
    chapterId: number,
    title: string,
    content: string,
    audioPath: string,
    options?: { musicVolume?: number; accentColor?: string; fontFamily?: string }
  ): Promise<string> {
    const buildDir = path.join(this.buildBaseDir, `${chapterId}`);
    fs.mkdirSync(buildDir, { recursive: true });

    try {
      console.log(`[VideosService] Starting video build for chapter ${chapterId}...`);

      // 1. Get TTS audio duration
      const duration = await this.getAudioDuration(audioPath);
      console.log(`[VideosService] Audio duration: ${duration}s`);

      // 2. Copy base template files
      const templateHtmlPath = path.join(this.templateDir, 'index.html');
      const templateMetaPath = path.join(this.templateDir, 'meta.json');
      
      const buildHtmlPath = path.join(buildDir, 'index.html');
      const buildMetaPath = path.join(buildDir, 'meta.json');

      fs.copyFileSync(templateMetaPath, buildMetaPath);
      let htmlContent = fs.readFileSync(templateHtmlPath, 'utf8');

      // 3. Copy speech audio file into build folder
      const buildSpeechPath = path.join(buildDir, 'speech.mp3');
      fs.copyFileSync(audioPath, buildSpeechPath);

      // Check if a valid background music track exists (greater than 1KB)
      let hasMusic = false;
      const sourceMusicPath = path.join(this.assetsMusicDir, 'relax.mp3');
      if (fs.existsSync(sourceMusicPath) && fs.statSync(sourceMusicPath).size > 1024) {
        const buildMusicPath = path.join(buildDir, 'music.mp3');
        fs.copyFileSync(sourceMusicPath, buildMusicPath);
        hasMusic = true;
        console.log(`[VideosService] Background music track found and copied successfully.`);
      } else {
        console.log(`[VideosService] No valid background music found in assets. Video will render without background music.`);
      }

      // 4. Apply custom options (accent color presets)
      let primaryColor = '#10B981';
      let secondaryColor = '#34D399';
      let accentColorVal = '#FBBF24'; // Amber yellow for highlight

      if (options?.accentColor === 'gold' || options?.accentColor === 'amber') {
        primaryColor = '#D97706'; // Amber-600
        secondaryColor = '#F59E0B'; // Amber-500
        accentColorVal = '#FEF08A'; // Yellow-200
      } else if (options?.accentColor === 'purple') {
        primaryColor = '#7C3AED'; // Purple-600
        secondaryColor = '#A78BFA'; // Purple-400
        accentColorVal = '#F472B6'; // Pink-400
      } else if (options?.accentColor === 'blue') {
        primaryColor = '#2563EB'; // Blue-600
        secondaryColor = '#60A5FA'; // Blue-400
        accentColorVal = '#22D3EE'; // Cyan-400
      } else if (options?.accentColor === 'red') {
        primaryColor = '#DC2626'; // Red-600
        secondaryColor = '#F87171'; // Red-400
        accentColorVal = '#FBBF24'; // Yellow
      }

      htmlContent = htmlContent.replace('--primary: #10B981;', `--primary: ${primaryColor};`);
      htmlContent = htmlContent.replace('--secondary: #34D399;', `--secondary: ${secondaryColor};`);
      htmlContent = htmlContent.replace('--accent: #FBBF24;', `--accent: ${accentColorVal};`);

      // Apply phông chữ
      if (options?.fontFamily === 'serif') {
        htmlContent = htmlContent.replace("font-family: 'Outfit', sans-serif;", "font-family: 'Playfair Display', serif;");
      }

      // Clean content from image tags for accurate word timestamp estimation
      const cleanContent = content.replace(/\[image:\s*[^\]]+\]\s*\n?/g, '');

      // 5. Generate word-level timestamps using Smart Timestamp Estimator
      const wordsData = this.estimateWordTimestamps(cleanContent, duration);
      console.log(`[VideosService] Generated ${wordsData.length} word timestamps`);

      // Parse scenes from content
      const blocks = content.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
      const scenes: { imageUrl?: string; scriptText: string }[] = [];
      for (const block of blocks) {
        const match = block.match(/^\[image:\s*([^\]]+)\]\s*\n?([\s\S]*)$/);
        if (match) {
          scenes.push({
            imageUrl: match[1].trim(),
            scriptText: match[2].trim(),
          });
        } else {
          scenes.push({
            scriptText: block,
          });
        }
      }

      // Map words to scenes to compute starts and ends
      let wordIndex = 0;
      const scenesData = scenes.map((scene) => {
        const sceneWords = scene.scriptText.trim().split(/\s+/).filter(Boolean);
        const numWords = sceneWords.length;
        
        let start = 0;
        let end = 0;
        
        if (numWords > 0 && wordsData.length > 0) {
          const startWord = wordsData[wordIndex];
          const endWordIdx = Math.min(wordIndex + numWords - 1, wordsData.length - 1);
          const endWord = wordsData[endWordIdx];
          
          start = startWord ? startWord.start : 0;
          end = endWord ? endWord.end : duration;
          
          wordIndex += numWords;
        }
        
        return {
          imageUrl: scene.imageUrl || '',
          scriptText: scene.scriptText,
          start,
          end,
        };
      });

      // 6. Inject dynamic variables into HTML
      htmlContent = htmlContent.replace('/* INJECT_WORDS_DATA */', JSON.stringify(wordsData, null, 2));
      htmlContent = htmlContent.replace('/* INJECT_SCENES_DATA */', JSON.stringify(scenesData, null, 2));
      htmlContent = htmlContent.replace('window.__videoDuration = 10;', `window.__videoDuration = ${duration};`);
      htmlContent = htmlContent.replace('data-duration="10"', `data-duration="${duration}"`);
      
      // Dynamically add the audio tags inside the body
      let musicVol = options?.musicVolume !== undefined ? options.musicVolume : 0.12;
      let audioTags = `\n  <audio id="speech" src="speech.mp3" data-track-index="1" data-start="0"></audio>`;
      if (hasMusic) {
        audioTags += `\n  <audio id="music" src="music.mp3" data-track-index="2" data-start="0" volume="${musicVol}"></audio>`;
      }
      audioTags += `\n</body>`;
      
      htmlContent = htmlContent.replace('</body>', audioTags);

      fs.writeFileSync(buildHtmlPath, htmlContent);

      // 6. Run HyperFrames Render inside the build directory
      const outputVideoPath = path.join(this.outputDir, `${chapterId}.mp4`);
      console.log(`[VideosService] Running hyperframes render for chapter ${chapterId}...`);

      // We run npx hyperframes render in the build directory to produce out.mp4
      await execAsync(`npx hyperframes render -o out.mp4`, { cwd: buildDir });

      const buildOutMp4 = path.join(buildDir, 'out.mp4');
      if (fs.existsSync(buildOutMp4)) {
        fs.renameSync(buildOutMp4, outputVideoPath);
        console.log(`[VideosService] Video generated successfully at: ${outputVideoPath}`);
        return outputVideoPath;
      } else {
        throw new Error('HyperFrames render succeeded but output out.mp4 not found');
      }

    } catch (error) {
      console.error(`[VideosService] Failed to generate video for chapter ${chapterId}:`, error);
      throw error;
    } finally {
      // Clean up build directory
      try {
        if (fs.existsSync(buildDir)) {
          fs.rmSync(buildDir, { recursive: true, force: true });
        }
      } catch (err) {
        console.warn(`[VideosService] Cleanup failed for ${buildDir}:`, err.message);
      }
    }
  }

  /**
   * Helper to get audio duration using ffprobe, falls back to char estimation if fails.
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
      );
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('[VideosService] ffprobe failed to get duration, falling back to estimation:', e.message);
    }
    // Fallback: average 0.18 seconds per character
    const stats = fs.statSync(audioPath);
    // Typical MP3 128kbps has ~16KB/s. Let's estimate from file size:
    const estSec = stats.size / (16 * 1024);
    return Math.max(estSec, 5);
  }

  /**
   * Smart Timestamp Estimator:
   * Splits text into words and estimates start/end times proportional to character lengths,
   * adding natural padding/pauses at punctuation marks.
   */
  private estimateWordTimestamps(text: string, totalDuration: number): { text: string; start: number; end: number }[] {
    // 1. Clean and split words
    const rawWords = text.trim().split(/\s+/);
    if (rawWords.length === 0) return [];

    // Calculate characters for each word, including its trailing pause weight
    const wordLengths = rawWords.map((word) => {
      let weight = word.length;
      // Add pause weight for punctuation
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        weight += 4; // Longer pause at end of sentence
      } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
        weight += 2; // Shorter pause at comma
      }
      return weight;
    });

    const totalWeight = wordLengths.reduce((sum, len) => sum + len, 0);

    // 2. Distribute time based on character lengths
    let currentStart = 0;
    const wordsData = rawWords.map((word, idx) => {
      const weight = wordLengths[idx];
      const duration = totalDuration * (weight / totalWeight);
      const start = parseFloat(currentStart.toFixed(3));
      
      // Calculate true end but leave a tiny silent tail if it has a punctuation pause
      let end = parseFloat((currentStart + duration).toFixed(3));
      currentStart += duration;

      // Adjust word display to not highlight during the pause gap
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        end = parseFloat((end - duration * 0.4).toFixed(3));
      } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
        end = parseFloat((end - duration * 0.25).toFixed(3));
      }

      return {
        text: word,
        start,
        end: Math.max(end, start + 0.05)
      };
    });

    return wordsData;
  }
}
