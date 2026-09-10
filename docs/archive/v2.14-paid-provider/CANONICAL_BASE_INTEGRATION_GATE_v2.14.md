# Canonical v2.13.3 Base Integration Gate

## Purpose

The v2.14.2 overlay is designed to upgrade one frozen complete application baseline. Structural similarity is not enough for the classroom release because an older or partially reconstructed repository could retain missing UI, export, recovery, or Research AI behavior.

## Canonical source

Filename

`Research_Methods_Studio_v2.13.3_COMPLETE_UPDATED_GitHub_Package.zip`

SHA-256

`6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78`

## Default behavior

`scripts/apply-v2.14-production-overlay.py` computes the source ZIP SHA-256 before extraction. A canonical build continues only when that SHA-256 exactly matches the frozen value above. The resulting `release-manifest-v2.14.json` records both the observed source digest and `source_verification: canonical_v2.13.3_sha256_match`.

## Development-only override

`--allow-compatible-source` permits a structurally compatible source for synthetic updater tests or engineering review. A build produced with that switch records `source_verification: compatible_source_override_noncanonical`. Such an output must not be labeled the canonical classroom repository.

## Why this gate exists

The overlay changes security-sensitive Research Chat code while preserving a large existing student application. Exact-source pinning prevents a successful overlay test on one v2.13 variant from being mistaken for validation of the frozen v2.13.3 application.

## Remaining canonical integration test

When the exact source ZIP is available locally, run the updater without the development override. After it succeeds, run the combined-repository browser and regression checks before any hosting or GitHub upload.
