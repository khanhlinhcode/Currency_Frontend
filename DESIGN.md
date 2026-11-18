# Banknote AI public demo design

## Purpose

The public portfolio demo lets a visitor try banknote recognition and inspect the saved model and MLOps evidence without signing in. All report pages are read only. The metrics are snapshots, not live production telemetry; the model remains a candidate.

## Direction

- **Product:** A public recognition tool and evidence viewer for a banknote classification project.
- **Character:** Calm, exact, and approachable.
- **World:** A currency inspection desk and a measured research report.
- **Moments:** The image upload is the primary interaction; model charts carry the strongest data color.
- **Signature:** Confidence bars connect a single prediction with the model's evaluation views.

## Visual system

- **Scene:** A visitor opens the demo on a laptop or phone, often alongside a CV. The interface should make the recognition task immediate, then make evidence easy to inspect.
- **Palette:** Neutral near-white workspace (`#f6f7f9`), white navigation and report surfaces, graphite text (`#1d1d1f`), and a focused blue accent (`#0071e3`). Orange is reserved for a contrasting data series. Error and caution states use text labels alongside color.
- **Type:** The platform system font keeps Vietnamese copy legible on desktop and mobile. Tabular numerals align measurements; type size and weight establish hierarchy.
- **Surfaces:** 18px report corners, light dividers, restrained depth, 16–24px section gaps. The recognition introduction uses a quiet neutral surface, with the upload task close to the first viewport. Avoid decorative glows and filler cards.
- **Motion:** Short interaction transitions only. Reduced motion removes them.

## Layout and behavior

The desktop shell has grouped navigation for Khám phá, Mô hình, and Vận hành. On narrow screens it becomes a drawer with a close control, Escape support, and contained keyboard focus. Report pages share one title treatment, metric cards, chart panels, and horizontally scrollable tables. The recognition page leads with one action and a direct link to the model dashboard. Upload, camera, loading, error, result, and empty states remain available. A newer image request must invalidate an older pending result. The backend's authentication and release controls are outside the public demo.

## Evidence rules

Never present diagnostic accuracy as approved production accuracy. The model page offers one concise methodology disclosure; the main reports stay focused on metrics and their dates. Monitoring labels identify stored snapshots and limited sample size. Runtime comparisons identify TensorFlow and ONNX as the same model. Do not create sample metrics or claim live monitoring from saved snapshots.
