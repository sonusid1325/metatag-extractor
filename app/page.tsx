"use client";

import { useState } from "react";
import Image from "next/image";

interface MetadataResult {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  author?: string;
  date?: string;
  publisher?: string;
  canonical?: string;
  favicon?: string;
  language?: string;
  feeds?: string[];
  extractedAt: string;
  [key: string]: string | string[] | undefined;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [error, setError] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract metadata");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderMetadataItem = (
    label: string,
    value: string | string[] | undefined,
    key: string,
  ) => {
    if (!value) return null;

    const isUrl =
      typeof value === "string" &&
      (value.startsWith("http") || value.startsWith("//"));
    const isImage = key === "image" || key === "logo" || key === "favicon";

    return (
      <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {label}
          </h3>
          <button
            onClick={() =>
              copyToClipboard(
                typeof value === "string" ? value : JSON.stringify(value),
              )
            }
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copy to clipboard"
          >
            📋
          </button>
        </div>

        {isImage && typeof value === "string" ? (
          <div className="space-y-2">
            {!failedImages.has(value) ? (
              <Image
                src={value}
                alt={label}
                width={300}
                height={128}
                className="max-w-xs max-h-32 object-contain rounded border"
                onError={() => {
                  setFailedImages((prev) => new Set(prev).add(value));
                }}
              />
            ) : (
              <img
                src={value}
                alt={label}
                className="max-w-xs max-h-32 object-contain rounded border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
              {value}
            </p>
          </div>
        ) : isUrl && typeof value === "string" ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
          >
            {value}
          </a>
        ) : Array.isArray(value) ? (
          <ul className="space-y-1">
            {value.map((item, index) => (
              <li
                key={index}
                className="text-gray-700 dark:text-gray-300 break-all"
              >
                {typeof item === "string" && item.startsWith("http") ? (
                  <a
                    href={item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {item}
                  </a>
                ) : (
                  String(item)
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 break-words">
            {String(value)}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Website Metadata Extractor
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Extract comprehensive metadata from any website including title,
              description, images, and SEO tags
            </p>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Website URL
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Extracting...
                      </div>
                    ) : (
                      "Extract Metadata"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Extracted Metadata
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Extracted at {new Date(result.extractedAt).toLocaleString()}
                </span>
              </div>

              <div className="grid gap-4">
                {/* Primary metadata */}
                {renderMetadataItem("Final URL", result.url, "url")}
                {renderMetadataItem("Title", result.title, "title")}
                {renderMetadataItem(
                  "Description",
                  result.description,
                  "description",
                )}
                {renderMetadataItem("Main Image", result.image, "image")}
                {renderMetadataItem("Logo", result.logo, "logo")}
                {renderMetadataItem("Favicon", result.favicon, "favicon")}
                {renderMetadataItem("Author", result.author, "author")}
                {renderMetadataItem("Publisher", result.publisher, "publisher")}
                {renderMetadataItem("Publication Date", result.date, "date")}
                {renderMetadataItem("Language", result.language, "language")}
                {renderMetadataItem(
                  "Canonical URL",
                  result.canonical,
                  "canonical",
                )}
                {renderMetadataItem("RSS/Atom Feeds", result.feeds, "feeds")}

                {/* Additional metadata */}
                {Object.entries(result)
                  .filter(
                    ([key]) =>
                      ![
                        "url",
                        "title",
                        "description",
                        "image",
                        "logo",
                        "favicon",
                        "author",
                        "publisher",
                        "date",
                        "language",
                        "canonical",
                        "feeds",
                        "extractedAt",
                      ].includes(key),
                  )
                  .map(([key, value]) =>
                    renderMetadataItem(
                      key
                        .replace(/[:-]/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                      value,
                      key,
                    ),
                  )}
              </div>

              {/* JSON Export */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Raw JSON Data
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(result, null, 2))
                    }
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-gray-800 dark:text-gray-200">
                    {JSON.stringify(result, null, 2)}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
