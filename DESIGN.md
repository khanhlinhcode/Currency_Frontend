# Banknote AI public demo design

## Purpose

The public portfolio demo lets a visitor try banknote recognition and inspect the saved model and MLOps evidence without signing in. All report pages are read only. The metrics are snapshots, not live production telemetry; the model remains a candidate.

## Visual system

- **Scene:** A visitor opens the demo on a laptop or phone, often alongside a CV. The interface should make the recognition task immediate, then make evidence easy to inspect.
- **Palette:** Deep banknote blue for navigation and the recognition hero (`#14243d`, `#20469e`), cool paper for the workspace (`#f3f6fa`), white report surfaces, and muted amber (`#b97320`) for a second data series. Error and caution states use red or warm paper with text labels.
- **Type:** Barlow Semi Condensed for headings and Fira Sans for body text. Tabular numerals align measurements; text never relies on color alone.
- **Surfaces:** 14px report corners, light dividers, restrained depth, 16–24px section gaps. The recognition hero uses circular security-print geometry to recall banknote engraving without depicting a real currency.
- **Motion:** Short interaction transitions only. Reduced motion removes them.

## Layout and behavior

The desktop shell has grouped navigation for Khám phá, Mô hình, and Vận hành. On narrow screens it becomes a drawer with a close overlay. Report pages share one title treatment, metric cards, chart panels, horizontally scrollable tables, and a visible source note. The recognition page leads with one action and a direct link to the model dashboard. Upload, camera, loading, error, result, and empty states remain available. The backend's authentication and release controls are outside the public demo.

## Evidence rules

Never present diagnostic accuracy as approved production accuracy. Keep the old test set and data quality caveats next to the relevant results. Do not create sample metrics or claim live monitoring from saved snapshots.
