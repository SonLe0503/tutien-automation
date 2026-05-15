import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { join } from 'path';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  // Chạy mỗi 30 phút (0 */30 * * * *)
  @Cron('0 */30 * * * *')
  async handleCron() {
    this.logger.log('Starting scheduled crawl task...');
    await this.crawlLatest();
  }

  async crawlLatest() {
    // Đường dẫn tới file python crawler
    const crawlerPath = join(process.cwd(), 'crawler', 'crawler.py');
    
    // Thực thi lệnh python
    exec(`python3 ${crawlerPath}`, (error, stdout, stderr) => {
      if (error) {
        this.logger.error(`Error executing crawler: ${error.message}`);
        return;
      }
      if (stderr) {
        this.logger.warn(`Crawler stderr: ${stderr}`);
      }
      this.logger.log(`Crawler output: ${stdout}`);
    });
  }
}
