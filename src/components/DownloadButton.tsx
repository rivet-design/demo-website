import { useState, useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';

const R2_PUBLIC_URL = 'https://pub-040a2f5482814f468dacec8f11d37f1e.r2.dev';

type ReleaseManifest = {
  version: string;
  url: string;
};

type DownloadButtonProps = {
  children: ReactNode;
  className?: string;
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

const DownloadButton = ({ children, className }: DownloadButtonProps) => {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      })
      .catch((err) => {
        console.error('[DownloadButton] Failed to fetch manifest:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDownload = () => {
    if (!manifest?.url) return;

    posthog.capture('download_clicked', {
      version: manifest.version,
      source: 'landing',
    });

    window.location.href = manifest.url;
  };

  return (
    <button onClick={handleDownload} disabled={isLoading} className={className}>
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading\u2026
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default DownloadButton;
