/** @jest-environment node */
import { renderInstallEmail } from './install-email';
import { INSTALL_COMMANDS } from '../src/lib/install';

describe('transactional install email', () => {
  const ref = 'r_aZ09bY18';
  const email = renderInstallEmail(ref, 'https://rivet.design');

  it('renders HTML and plain text', () => {
    expect(email.html).toMatchSnapshot();
    expect(email.text).toMatchSnapshot();
    expect(email.subject).toBe('Your Rivet install link');
  });

  it('uses the same ref in the destination and all current site commands', () => {
    for (const command of Object.values(INSTALL_COMMANDS)) {
      expect(email.text).toContain(`${command} --ref ${ref}`);
      expect(email.html).toContain(`${command} --ref ${ref}`);
    }
    expect(email.text).toContain(
      `/install?ref=${ref}&utm_source=email&utm_medium=transactional&utm_campaign=mobile_install`,
    );
    expect(email.html).toContain(`/install?ref=${ref}&amp;utm_source=email`);
  });

  it('uses the configured site origin and escapes HTML', () => {
    const preview = renderInstallEmail(
      ref,
      'https://preview.rivet.design/some-path',
    );
    expect(preview.text).toContain('https://preview.rivet.design/install?');
    expect(preview.html).toContain('You&#39;re getting this because you asked');
  });
});
