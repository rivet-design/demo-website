import { copiedInstallCommand, type InstallAgentId } from '../src/lib/install';
import type { InstallRef } from '../src/lib/installRef';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );

export const renderInstallEmail = (ref: InstallRef, siteUrl: string) => {
  const url = new URL('/install', siteUrl);
  url.search = new URLSearchParams({
    ref,
    utm_source: 'email',
    utm_medium: 'transactional',
    utm_campaign: 'mobile_install',
  }).toString();
  const agents: { id: InstallAgentId; label: string }[] = [
    { id: 'claude', label: 'Claude' },
    { id: 'codex', label: 'Codex' },
    { id: 'cursor', label: 'Cursor' },
  ];
  const footer =
    "You're getting this because you asked for an install link on rivet.design.";
  const text = [
    'Open this on your computer to install Rivet.',
    '',
    `Open install page: ${url.href}`,
    '',
    'Rivet helps you explore design directions with your coding agent.',
    'Or paste this into your coding agent:',
    '',
    ...agents.flatMap(({ id, label }) => [
      label,
      copiedInstallCommand(id, ref),
      '',
    ]),
    footer,
  ].join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your Rivet install link</title></head>
<body style="margin:0;padding:0;background:#fafafa;color:#292222;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;"><tr><td style="padding:32px 24px;">
<p style="margin:0 0 24px;font-size:24px;font-weight:bold;color:#EC4423;">Rivet</p>
<h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;">Open this on your computer to install Rivet.</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5;">Rivet helps you explore design directions with your coding agent.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#EC4423" style="border-radius:6px;mso-padding-alt:14px 24px;"><a href="${escapeHtml(url.href)}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;">Open install page</a></td></tr></table>
<h2 style="margin:32px 0 16px;font-size:18px;">Or paste this into your coding agent</h2>
${agents.map(({ id, label }) => `<p style="margin:16px 0 6px;font-size:14px;font-weight:bold;">${label}</p><p style="margin:0;padding:12px;background:#f5f3ee;font-family:Consolas,monospace;font-size:13px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere;">${escapeHtml(copiedInstallCommand(id, ref))}</p>`).join('\n')}
<p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#6b6262;">${escapeHtml(footer)}</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject: 'Your Rivet install link', html, text };
};
