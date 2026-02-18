const cheerio = require('cheerio');
const { URL } = require('url');

class Parser {
    // Extract text content from html
    extractText(html) {
        const $ = cheerio.load(html);
        $('script, style, nav, footer, iframe').remove(); // Remove non-content elements

        // Extract title
        const title = $('title').text().trim() || 'Untitled';

        // Extract main content
        const content = $('body').text().replace(/\s+/g, ' ').trim();

        // Create a snippet (first 200 chars)
        const snippet = content.substring(0, 200).trim() + '...';
        return { title, content, snippet };
    }

    // Extract links from html
    extractLinks(html, baseUrl) {
        const $ = cheerio.load(html);
        const links = new Set();

        $('a[href').each((i, elem) => {
            try {
                const href = $(elem).attr('href');
                if (!href) return;
                const absoluteUrl = new URL(href, baseUrl).href;

                if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
                    links.add(absoluteUrl);
                }
            } catch (err) {
                // Ignore invalid URLs
            }
        });
        return Array.from(links);
    }

    // Check if URL is valid for crawling
    isValidURL(url) {
        try {
            const urlObj = new URL(url);

            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return false;
            }

            const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.mp4', '.mp3'];
            if (skipExtensions.some(ext => urlObj.pathname.toLocaleLowerCase().endsWith(ext))) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = Parser;