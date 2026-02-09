// import puppeteer from 'puppeteer';
// Note: Install puppeteer via `npm install puppeteer`

export interface ScrapeResult {
    url: string;
    title: string;
    content: string; // HTML or Text
    screenshot?: string; // Base64
    error?: string;
}

export class ScrapingService {
    private static instance: ScrapingService;
    private browser: any = null; // Puppeteer.Browser

    private constructor() {}

    public static getInstance(): ScrapingService {
        if (!ScrapingService.instance) {
            ScrapingService.instance = new ScrapingService();
        }
        return ScrapingService.instance;
    }

    private async getBrowser() {
        if (!this.browser) {
            // Lazy load puppeteer to avoid require errors if not installed
            try {
                const puppeteer = require('puppeteer');
                console.log('[Scraper] Launching Headless Browser...');
                this.browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            } catch (e: any) {
                console.error('[Scraper] Failed to launch browser. Is puppeteer installed?');
                throw new Error('Scraping dependency missing: ' + e.message);
            }
        }
        return this.browser;
    }

    public async scrape(url: string, options: { screenshot?: boolean, waitFor?: number } = {}): Promise<ScrapeResult> {
        let page = null;
        try {
            const browser = await this.getBrowser();
            page = await browser.newPage();

            // Set user agent to avoid basic blocks
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            console.log(`[Scraper] Navigating to ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            if (options.waitFor) {
                await new Promise(r => setTimeout(r, options.waitFor));
            }

            const title = await page.title();
            const content = await page.content();
            
            let screenshot = undefined;
            if (options.screenshot) {
                const buffer = await page.screenshot({ encoding: 'base64', fullPage: true });
                screenshot = buffer as string;
            }

            return {
                url,
                title,
                content,
                screenshot
            };

        } catch (error: any) {
            console.error(`[Scraper] Error scraping ${url}:`, error);
            return {
                url,
                title: 'Error',
                content: '',
                error: error.message
            };
        } finally {
            if (page) await page.close();
        }
    }

    public async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
