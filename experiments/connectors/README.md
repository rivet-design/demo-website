# Connectors experiment

A sample **"Connect your sources"** UI for the demo site — wiring Rivet up to
three reference sources: **Pinterest**, **Are.na**, and **Local files**.

Built entirely on the real Rivet design system (tokens from
`tailwind.config.ts` + the `type-*` classes in `src/styles/index.css`):
brand orange `bg-primary` (#E14017), `accent-foreground` dark surface, `bg-main`
white surfaces, `border-border`, and the `type-heading-2 / type-label-lg /
type-caption / type-overline` type scale.

## Files

| File | What it is |
|---|---|
| `Connectors.tsx` | The baseline connector panel. Rivet variants explore design directions against this. |
| `ConnectorsExperiment.tsx` | Preview canvas rendering the panel centered. |
| `variants/` | Materialized Rivet design variants (one self-contained, routed file each). |

## Where to see it

`npm run dev`, then open these routes (wired in `src/main.ts`; the
`experiments/**` glob is added to `tailwind.config.ts`):

| Route | Variant |
|---|---|
| `/experiments/connectors` | Baseline panel (`Connectors.tsx`) |
| `/experiments/connectors/card-grid` | **Card grid** — equal vertical cards in a responsive grid |
| `/experiments/connectors/compact-list` | **Compact list rows** — dense scannable rows |
| `/experiments/connectors/dark-panel` | **Dark panel** — on the dark `accent-foreground` chrome |
| `/experiments/connectors/guided-checklist` | **Guided setup checklist** — onboarding progress + steps |

## Goal

Explore a few distinct **design directions** for how this connector UI looks and
feels — layout, density, how connected vs unconnected states read — while
staying 100% within the Rivet design system and colors.
