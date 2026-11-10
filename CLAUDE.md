# Lumio Guard --- Claude Code Project Instructions

Before making changes, read
`docs/LUMIO_GUARD_Claude_Code_Engineering_Handoff.md` (or the equivalent
handoff file path supplied by the user). Treat it as the current
consolidated product brief.

## Working rules

-   Inspect the repository, existing instructions, package manager,
    tests, and uncommitted changes before editing.
-   Do not overwrite existing work or make broad structural changes
    without explaining the reason.
-   Work in small milestones. Present a plan and wait for approval
    before the first implementation milestone.
-   The first target is v0: a local-first Chromium Manifest V3
    extension.
-   v0 must not include Lumio-owned backend calls, accounts, remote
    analytics, or transmission of browsing URLs.
-   Do not add Supabase, authentication, billing, dashboards, or cloud
    sync until the later approved phases.
-   Use the smallest browser permission set possible. Explain the
    purpose and privacy implications of each permission.
-   Do not claim universal web protection, perfect ad detection,
    protection in other browsers, or device-wide screen-time
    measurement.
-   Measure only supported browser activity. Do not represent it as
    total device or app screen time.
-   Do not store or transmit full browsing history. Prefer local
    processing and minimal aggregates.
-   Keep Christian/faith-oriented content optional and isolated. Core
    protection must work without it.
-   Use respectful, non-shaming language in block pages and wellbeing
    prompts.
-   Treat 15/30/60-minute interventions as configurable hypotheses to
    validate, not hardcoded product truth.
-   Test false positives as seriously as false negatives.
-   Do not add AI classification unless a specific validated requirement
    justifies its cost, privacy impact, and accuracy trade-offs.
-   Flag conflicts between product documents rather than silently
    choosing.
-   Mark assumptions clearly. Ask the product owner when a decision
    materially changes privacy, security, scope, or user experience.

## Required milestone reporting

After each milestone, report: 1. What was implemented. 2. Files created
or changed. 3. Tests and manual checks run. 4. Results and known
limitations. 5. Security/privacy implications. 6. Remaining decisions
and recommended next milestone.

Stop at the approved milestone. Do not continue into later phases
without approval.
