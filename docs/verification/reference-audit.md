# HTML/CSS reference research audit — 31 October 2026

## Verified source integrity

The 11 pinned raw input files in `data/reference.json` / `public/sources/source-manifest.json` were downloaded again from their exact `raw.githubusercontent.com` commit URLs. Every SHA-256 and byte size matches the manifest. Evidence: `reference-hashes.json` beside this report. All four locally bundled dataset license files also match the recorded SHA-256.

GitHub's embedded commit metadata was read from the exact commit pages. All recorded committed dates match, after UTC conversion, and predate or equal the requested end-of-day 29 October 2026 cutoff:

- Microsoft vscode-custom-data: `01df47ad7cc0b140624fc941ff57618c36ed46a1`, 22 June 2026 18:22:20 UTC.
- MDN data: `fc60c55f5018ea399516a84ea2c64adf7731da82`, 15 October 2026 10:06:49 UTC.
- MDN browser-compat-data: `aed1f62c2a5cf37c42ae934c1a44f172397a0d8d`, 29 October 2026 11:03:51 UTC.
- W3C Webref: `6ac6259c96b11e0aea5c34a16822eb06add278c9`, 26 October 2026 19:01:33 UTC.

These checks validate byte provenance and cutoff, not every upstream statement or every compatibility implementation. The BCD commit exists and has the stated date, but its combined extraction hash has not independently been regenerated from the full repository in this audit.

## Actual coverage

The raw inventory has 3,117 records; `correctedReference` adds 32 authored relative-length units, giving 3,149 displayed records. The display includes 1,333 records without explanatory prose and 1,455 records with compatibility metadata. The authored unit supplement adds explanations, but no compatibility version tables.

The current bank exports 849 source-backed facts, 2,547 format variants, and 100 code-completion tasks. There are 41 guides, 24 lessons, 9 projects, 16 visual practices, and 127 reference recipes. These are current program outputs, not a claim of 2,547 independently researched facts.

## Recommended factual corrections

1. `css-at-rule-charset` currently says it defines the document character set. Correct this to the stylesheet byte-decoding encoding declaration. It does not set the HTML document's character encoding. It has strict beginning-of-stream syntax; CSS Syntax explains that this looks like an at-rule but there is no actual parsed @charset rule. Use an authored overlay, preserving the pinned inputs. Primary source predating cutoff: https://www.w3.org/TR/2026/CRD-css-syntax-3-20261001/#input-byte-stream .

2. `css-at-rule-media` says only “for a particular media type.” Replace it with a description of conditionally applying rules when a media query matches, including viewport and preference/media features. Primary source predating cutoff: https://www.w3.org/TR/2024/CRD-css-conditional-3-20240815/#at-ruledef-media .

3. `css-at-rule-property` has especially vague upstream prose. Explain registration of a custom property with syntax, inheritance, and initial-value behavior. Distinguish the 2024 published syntax from 2026 editor-draft changes before claiming implementation support. Published definition: https://www.w3.org/TR/2024/WD-css-properties-values-api-1-20240326/#at-property-rule . The 6 August 2026 editor draft at https://drafts.css-houdini.org/css-properties-values-api/#at-property-rule permits a comma-separated name list and optional descriptors; the published 2024 draft has one name and stronger descriptor requirements. Therefore **do not blindly remove `#` from the pinned @property grammar**: it accurately reflects the newer draft, but the generic compatibility table does not necessarily establish support for that extension.

4. Existing authored `:not()` correction is justified: modern Selectors Level 4 accepts a selector list, excludes pseudo-elements, and takes its argument list's highest specificity. Existing source is a dated January 2026 draft. Keep that overlay.

## Verification and completeness wording

- `scripts/verify-examples.mjs` uses PostCSS syntax parsing. It does not validate that each property/value is legal, that HTML content models conform, or that a browser renders correctly. Say “CSS documents parsed,” not “all snippets verified” based on that check alone.
- The existing grammar-only labels and missing-prose counts are appropriate and should remain visible. Do not label this inventory a complete explanatory tutorial for every HTML/CSS feature.
- CSS accepts unbounded author-defined names, numbers, URLs, and combinations; list grammars and value families instead of claiming an enumeration of every value. Primary values reference: https://www.w3.org/TR/2024/WD-css-values-4-20240312/ .
- CSS Snapshot 2026 classifies specification stability rather than browser adoption: https://www.w3.org/TR/2026/NOTE-css-2026-20260622/ . Specification inclusion is not implementation approval.
- The live WHATWG index currently says last updated 30 October 2026. A live link is valuable for further reading, but it is not proof that newly edited prose was present at the 29 October cutoff. The pinned dataset provenance is the historical inventory evidence.

## Checks run

Read the reference types, authored corrections and unit supplement, question generator, full list of 100 code tasks, example-generation logic, recipe selection logic, exercise checks, and representative guides. Both existing reference test files passed using Node's test runner. Downloaded all 11 pinned datasets and compared hashes; checked locally bundled license hashes; independently checked commit dates on GitHub. No UI/browser checks, full standards conformance certification, or compatibility implementation tests were performed by this bounded audit.
