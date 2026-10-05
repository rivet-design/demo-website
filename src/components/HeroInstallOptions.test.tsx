import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { posthog } from '@/lib/posthog';
import { toast } from 'sonner';
import { INSTALL_AGENTS } from '@/lib/install';
import HeroInstallOptions from './HeroInstallOptions';

jest.mock('@/lib/posthog', () => ({ posthog: { capture: jest.fn() } }));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe('HeroInstallOptions', () => {
  let container: HTMLDivElement;
  let root: Root;
  const writeText = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<HeroInstallOptions />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const buttons = () =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button'));

  it('shows one button per agent in menu order', () => {
    expect(buttons().map((b) => b.textContent)).toEqual([
      'Codex',
      'Claude',
      'Cursor',
    ]);
  });

  it.each(INSTALL_AGENTS.map((agent, i) => [agent.id, i] as const))(
    'copies the shared %s prompt, tracks it, and toasts',
    async (id, i) => {
      const agent = INSTALL_AGENTS[i];
      await act(async () => {
        buttons()[i].click();
      });

      expect(posthog.capture).toHaveBeenCalledWith('download_clicked', {
        source: 'landing_hero',
        download_type: id,
      });
      expect(writeText).toHaveBeenCalledWith(agent.prompt);
      expect(toast.success).toHaveBeenCalledWith('Prompt copied to clipboard', {
        description: `Paste into ${agent.label} to install the Rivet MCP.`,
      });
    },
  );
});
