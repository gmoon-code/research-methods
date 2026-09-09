# v2.15 GitHub integration note

The current `main` branch of `gmoon-code/research-methods` is the actual stable GitHub baseline used for this integration.

The later v2.13.x student-flow redesign existed as a local packaged artifact in the prior development session, but its complete source tree is not currently present on GitHub and is not available in the current runtime.

For that reason, this branch does **not** falsely claim to contain the full v2.13.3 interface.

The v2.15 branch adds the free GitHub-only Research Chat architecture to the actual GitHub baseline without overwriting `main`.

After the local-chat branch is technically validated, the later guided-flow UX can be restored/rebuilt in a separate controlled integration step before replacing the production branch.
