import { useState, useEffect, ReactNode } from 'react';
import { posthog } from '@/lib/posthog';

const R2_PUBLIC_URL = 'https://releases.rivet.design';

type ReleaseManifest = {
  version: string;
  url: string;
};

type DownloadButtonProps = {
  children: ReactNode;
  className?: string;
  source?: string;
  downloadType?: string;
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

const DownloadButton = ({ children, className, source = 'landing', downloadType = 'mac' }: DownloadButtonProps) => {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  /**
   * @effect Fetch latest release manifest from R2
   * @deps None - runs once on mount
   */
  useEffect(() => {
    fetch(`${R2_PUBLIC_URL}/latest-mac.yml`)
      .then((response) => {
        if (!response.ok) {
          const err = new Error(`HTTP ${response.status}: Failed to fetch release manifest`);
          posthog.capture('release_manifest_fetch_failed', {
            source,
            error: err.message,
            status: response.status,
            url: `${R2_PUBLIC_URL}/latest-mac.yml`,
          });
          throw err;
        }
        return response.text();
      })
      .then((yaml) => {
        try {
          setManifest(parseYamlManifest(yaml));
        } catch (err) {
          posthog.capture('release_manifest_parse_failed', {
            source,
            error: err instanceof Error ? err.message : String(err),
          });
          setFetchFailed(true);
          console.error('[DownloadButton] Failed to parse manifest:', err);
        }
      })
      .catch((err) => {
        // Only set failed + log if not already handled in the .then (parse errors set it directly)
        if (!err.message?.startsWith('HTTP')) {
          posthog.capture('release_manifest_fetch_failed', {
            source,
            error: err instanceof Error ? err.message : String(err),
            url: `${R2_PUBLIC_URL}/latest-mac.yml`,
          });
        }
        setFetchFailed(true);
        console.error('[DownloadButton] Failed to fetch manifest:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDownload = () => {
    if (!manifest?.url) {
      posthog.capture('download_clicked_without_manifest', {
        source,
        download_type: downloadType,
        fetch_failed: fetchFailed,
      });
      return;
    }

    posthog.capture('download_clicked', {
      version: manifest.version,
      source,
      download_type: downloadType,
    });

    window.location.href = manifest.url;
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={className}
    >
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
            Loading...
          </span>
        ) : (
          children
        )}
    </button>
  );
};

export default DownloadButton;
