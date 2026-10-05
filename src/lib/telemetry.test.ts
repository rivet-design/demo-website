import { posthog } from './posthog';
import { telemetry } from './telemetry';

jest.mock('./posthog', () => ({ posthog: { capture: jest.fn() } }));

const capture = posthog.capture as jest.Mock;

describe('mobile install telemetry', () => {
  beforeEach(() => capture.mockClear());

  it('captures the dialog opening with its placement', () => {
    telemetry.trackMobileInstallEmailOpened({ placement: 'hero' });
    expect(capture).toHaveBeenCalledWith('mobile_install_email_opened', {
      placement: 'hero',
    });
  });

  it('captures submissions with only placement and outcome', () => {
    telemetry.trackMobileInstallEmailSubmitted({
      placement: 'hero',
      success: true,
    });
    expect(capture).toHaveBeenCalledWith('mobile_install_email_submitted', {
      placement: 'hero',
      success: true,
    });
  });
});
