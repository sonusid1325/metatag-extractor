import { NextRequest, NextResponse } from "next/server";
import metascraper from "metascraper";
import metascraperAuthor from "metascraper-author";
import metascraperDate from "metascraper-date";
import metascraperDescription from "metascraper-description";
import metascraperImage from "metascraper-image";
import metascraperLogo from "metascraper-logo";
import metascraperPublisher from "metascraper-publisher";
import metascraperTitle from "metascraper-title";
import metascraperUrl from "metascraper-url";
import * as cheerio from "cheerio";

const scraper = metascraper([
  metascraperAuthor(),
  metascraperDate(),
  metascraperDescription(),
  metascraperImage(),
  metascraperLogo(),
  metascraperPublisher(),
  metascraperTitle(),
  metascraperUrl(),
]);

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch webpage: ${response.status} ${response.statusText}`,
        },
        { status: 400 },
      );
    }

    const html = await response.text();
    const targetUrl = response.url;

    // Extract metadata
    const metadata = await scraper({ html, url: targetUrl });

    // Additional metadata extraction
    const $ = cheerio.load(html);

    // Extract additional meta tags
    const additionalMeta: Record<string, string | string[]> = {};

    // Open Graph tags
    $('meta[property^="og:"]').each((index, element) => {
      const property = $(element).attr("property");
      const content = $(element).attr("content");
      if (property && content) {
        additionalMeta[property] = content;
      }
    });

    // Twitter Card tags
    $('meta[name^="twitter:"]').each((index, element) => {
      const name = $(element).attr("name");
      const content = $(element).attr("content");
      if (name && content) {
        additionalMeta[name] = content;
      }
    });

    // Standard meta tags
    $("meta[name]").each((index, element) => {
      const name = $(element).attr("name");
      const content = $(element).attr("content");
      if (name && content) {
        additionalMeta[name] = content;
      }
    });

    // Get canonical URL
    const canonical = $('link[rel="canonical"]').attr("href");
    if (canonical) {
      additionalMeta.canonical = canonical;
    }

    // Get favicon
    const favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href");
    if (favicon) {
      additionalMeta.favicon = favicon.startsWith("http")
        ? favicon
        : new URL(favicon, targetUrl).href;
    }

    // Get page language
    const lang =
      $("html").attr("lang") ||
      $('meta[http-equiv="content-language"]').attr("content");
    if (lang) {
      additionalMeta.language = lang;
    }

    // Get RSS/Atom feeds
    const feeds: string[] = [];
    $(
      'link[type="application/rss+xml"], link[type="application/atom+xml"]',
    ).each((index, element) => {
      const href = $(element).attr("href");
      if (href) {
        feeds.push(
          href.startsWith("http") ? href : new URL(href, targetUrl).href,
        );
      }
    });
    if (feeds.length > 0) {
      additionalMeta.feeds = feeds;
    }

    // Combine all metadata
    const result = {
      url: targetUrl,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      logo: metadata.logo,
      author: metadata.author,
      date: metadata.date,
      publisher: metadata.publisher,
      ...additionalMeta,
      extractedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error extracting metadata:", error);
    return NextResponse.json(
      { error: "Failed to extract metadata" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST request with URL in body." },
    { status: 405 },
  );
}
