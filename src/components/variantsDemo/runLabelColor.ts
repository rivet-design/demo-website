// Direct port of Rivet core UI's run-label color util
// (rivet/src/ui/src/lib/runLabelColor.ts). A run label hashes to one of a
// fixed palette so the same run always gets the same tinted chip — part of the
// fluid-functionalism treatment of the variants panel.

export const RUN_LABEL_COLORS = [
  '#f59e0b', // amber
  '#38bdf8', // sky
  '#34d399', // emerald
  '#a78bfa', // violet
  '#fb7185', // rose
  '#22d3ee', // cyan
  '#fb923c', // orange
  '#a3e635', // lime
  '#e879f9', // fuchsia
  '#2dd4bf', // teal
];

export function runLabelStyle(label: string): {
  color: string;
  backgroundColor: string;
} {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  const color = RUN_LABEL_COLORS[Math.abs(hash) % RUN_LABEL_COLORS.length];
  // 8-digit hex: the color at ~13% alpha for a subtle tinted tag background.
  return { color, backgroundColor: `${color}22` };
}
