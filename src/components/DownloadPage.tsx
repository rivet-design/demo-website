import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { posthog } from '@/lib/posthog';

const R2_PUBLIC_URL = 'https://pub-040a2f5482814f468dacec8f11d37f1e.r2.dev';

type ReleaseManifest = {
  version: string;
  url: string;
};

/**
 * Parse electron-updater YAML manifest and construct DMG URL for manual downloads
 */
const parseYamlManifest = (yaml: string): ReleaseManifest => {
  const versionMatch = yaml.match(/^version:\s*(.+)$/m);

  if (!versionMatch) {
    throw new Error('Invalid manifest format');
  }

  const version = versionMatch[1].trim();

  return {
    version,
    url: `${R2_PUBLIC_URL}/Rivet-${version}-arm64.dmg`,
  };
};

const DownloadPage = () => {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * @effect Fetch latest release manifest from R2
   * @deps None - runs once on mount
   */
  useEffect(() => {
    fetch(`${R2_PUBLIC_URL}/latest-mac.yml`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch release info');
        }
        return response.text();
      })
      .then((yaml) => {
        setManifest(parseYamlManifest(yaml));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDownload = () => {
    if (manifest?.url) {
      posthog.capture('download_clicked', {
        version: manifest.version,
        source: 'download_page',
      });
      window.location.href = manifest.url;
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#FEFFF3] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex max-w-2xl flex-col items-center gap-6 text-center"
      >
        <h1 className="type-heading-1 text-black md:text-5xl">
          Download Rivet
        </h1>

        {loading && (
          <p className="type-subtitle text-gray-600">
            Loading latest version\u2026
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="type-body text-red-600">
              Failed to load download information. Please try again later.
            </p>
          </div>
        )}

        {manifest && !loading && !error && (
          <>
            <p className="type-subtitle text-xl text-gray-700">
              Version {manifest.version}
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <button
                onClick={handleDownload}
                className="type-label-lg rounded-lg bg-primary px-8 py-4 text-lg text-white transition-colors hover:bg-primary-hover"
              >
                Download for Mac
              </button>

              <a
                href="https://docs.rivet.design/"
                target="_blank"
                rel="noopener noreferrer"
                className="type-label-lg rounded-lg border border-primary px-8 py-4 text-lg text-primary transition-colors hover:bg-primary/10"
              >
                Set up guide
              </a>
            </div>

            <p className="type-caption text-gray-500">
              Compatible with Apple Silicon Macs
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default DownloadPage;
