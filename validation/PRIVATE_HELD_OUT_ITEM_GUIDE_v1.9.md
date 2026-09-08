# Private Held-Out Item Guide v1.9

A genuine held-out evaluation bank must **not** be stored in this public GitHub Pages repository.

Recommended private structure:

private_validation/
  item_blueprint.csv
  development_items.json
  locked_evaluation_items.json
  locked_evaluation_items.sha256
  rater_A/
  rater_B/
  adjudication/
  analysis/

Before collecting evaluation responses:

1. Freeze the evaluation JSON.
2. Compute its SHA-256 hash.
3. Record the date and version.
4. Do not use evaluation responses to change task wording or rubric anchors.
5. If changes become necessary, create a new evaluation version and report that the old set was retired.

The public `transfer-bank-v1.9.json` is a classroom/development bank only.
