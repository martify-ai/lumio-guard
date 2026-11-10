# Lumio Guard --- Engineering Handoff for Claude Code

**Document type:** Product + engineering handoff\
**Status:** Consolidated working brief; not a substitute for legal
review or final technical validation\
**Product name:** Lumio Guard\
**Prepared:** 8 November 2026\
**Primary launch context:** Nigeria; design so international expansion
remains possible\
**Purpose:** Give Claude Code a reliable source of truth for planning
and implementing the first usable version.

------------------------------------------------------------------------

## 1. What we are building

Lumio Guard is a digital protection and wellbeing product designed to
help young people use technology more safely, intentionally, and
responsibly.

It combines two primary product pillars:

1.  **Digital Protection:** reduce exposure to pornography, nudity,
    sexually explicit material, inappropriate web destinations, harmful
    redirects, and inappropriate advertising resources.
2.  **Digital Wellbeing:** help young people become aware of prolonged
    or mindless screen use, take breaks, and choose constructive
    alternatives.

The broader experience can be described through four actions:

-   **Protect** --- prevent harmful content from loading where the
    platform allows.
-   **Understand** --- provide a useful, privacy-conscious picture of
    digital activity.
-   **Interrupt** --- offer timely, proportionate reminders when use
    continues.
-   **Redirect** --- suggest a positive next action such as reading,
    studying, exercise, creativity, rest, relationships, reflection, or
    optional faith-oriented activities.

The long-term goal is not simply to restrict young people. It is to help
them develop judgment and self-control so they can use technology well
even when nobody is watching.

**Product promise:**\
\> Lumio Guard helps young people stay safe online, protect their
attention, and build healthier digital habits.

## 2. Why the product exists

Young people may encounter explicit or harmful material intentionally or
accidentally through: - Websites and search results - Advertisements and
embedded resources - Redirects and pop-ups - Images and videos -
Recommendations and feeds - Other browser experiences

Separately, digital services can encourage prolonged engagement. A
teenager may scroll or consume passive entertainment for long periods
without noticing how much time has passed.

Existing tools often solve only one part: - Website blockers restrict
destinations. - Ad blockers remove selected advertising. -
Parental-control tools focus on guardian restrictions. - Screen-time
tools measure time. - Wellbeing apps encourage habits.

Lumio Guard's opportunity is to connect protection with supportive habit
development, without becoming a surveillance product.

## 3. Founding motivation and faith context

The product was initially motivated by a desire to help teenagers and
young people---particularly Christian young people---avoid pornography,
nudity, sexually explicit content, and online environments that conflict
with their values.

Christian families may benefit from optional features such as: -
Scripture-based reflection - Prayer or reflection prompts - Digital
discipline plans - Faith-oriented break suggestions - Optional
accountability experiences

However: - Basic protection must not require a Christian identity. -
Faith features must be optional and off unless deliberately enabled. -
The protection engine must work identically whether faith features are
enabled or disabled. - Do not shame, label, or spiritually condemn a
young person in block pages or prompts.

The product should be useful to families with different beliefs and
values while allowing Christian users to enable an additional
faith-oriented experience.

## 4. Users and modes

### Primary user: protected young person

A teenager or young person who uses the supported browser and receives
protection and wellbeing interventions.

### Secondary user: parent or guardian

Creates the account, creates a protected profile, configures policies,
pairs devices, and sees appropriate high-level summaries.

### Future user: self-directed young adult

Voluntarily configures personal protection and wellbeing goals without a
guardian-managed account.

### Future organizational customers

Churches, youth ministries, schools, NGOs, and youth-serving
organizations may sponsor access or use a separately designed
organization edition. This is not part of the first MVP.

Do not assume that every young person should be managed through a parent
account forever. Self-directed mode is a meaningful future direction.

## 5. Product principles --- non-negotiable

1.  **Protect, don't shame.**
2.  **Guide, don't merely punish.**
3.  **Privacy by design.**
4.  Collect the minimum data necessary.
5.  Prefer on-device processing and aggregate reporting.
6.  Do not collect complete browsing history by default.
7.  Do not monitor private messages.
8.  Do not use camera or microphone surveillance.
9.  Be transparent about what is blocked and why.
10. Give guardians useful controls without unnecessary surveillance.
11. Help young people develop self-control, not permanent dependence on
    restrictions.
12. Intervene proportionately; avoid notification fatigue.
13. Never claim universal or perfect protection.
14. Make technical limitations visible to users.
15. Basic safety should remain meaningfully available to people who
    cannot pay.

## 6. The two product pillars

### A. Digital Protection

Initial categories: - Pornography - Nudity and sexually explicit
material - Explicit/adult websites - Known inappropriate advertising
domains/resources - Unsafe redirects to prohibited destinations - Other
harmful categories, configurable as the product matures

Protection mechanisms considered: - Curated, maintained domain
blocklists - Local request filtering using browser-supported APIs -
Redirect destination checks where supported - Safe Search enforcement or
guidance on supported search engines - Known inappropriate
advertising-resource blocking - Allowlist and exception handling - Local
block page with a clear explanation and safe-navigation action -
False-positive reporting

**Important technical reality:** A browser extension cannot reliably
identify every explicit image, video, or ad creative on every website.
Manifest V3 and browser APIs impose restrictions. Blocking known domains
and request resources is feasible; universal semantic inspection of
every page/ad is not. Do not claim that all pornography, nudity, or
inappropriate advertisements will always be caught.

Prefer preventing a known prohibited request from loading rather than
loading it and hiding it afterward.

### B. Digital Wellbeing

The original intervention idea: - Around **15 minutes:** gentle
awareness reminder. - Around **30 minutes:** stronger prompt encouraging
a break or intentional choice. - Around **60 minutes:** deeper
reflection or a more substantial break suggestion.

These are starting hypotheses, not immutable rules. Thresholds should be
configurable and tested with real users.

Possible intervention actions: - Continue intentionally - Take a short
break - Choose an activity - Start a focus session (future) - Read or
study - Move/stretch/walk - Create something - Connect with
family/friends - Rest - Pray or reflect (only when faith mode is
enabled)

The experience should help users choose, not bombard them.

**Measurement boundary:** The browser extension can measure supported
browser activity. It cannot truthfully report total phone/computer
screen time or time spent inside native apps. Device-wide measurement
requires a separate mobile/desktop/OS/network approach and is out of MVP
scope.

The product should distinguish active use from idle time and should not
count every open tab as active usage. Do not treat all screen time
equally: learning or purposeful work may be different from passive
entertainment, but reliable classification must be validated before
presenting it as fact.

## 7. MVP decision --- build small, validate, expand

The current recommended MVP is:

**One Chromium-based browser extension first**, using Manifest V3 where
supported.

The MVP should validate: 1. Can a guardian configure a protection
policy? 2. Can the extension enforce known high-confidence blocked
destinations? 3. Can it continue enforcing the last valid policy while
offline? 4. Can it measure supported active browser sessions reasonably?
5. Can it deliver 15/30/60 interventions reliably? 6. Can the experience
do this without collecting raw browsing history?

### Recommended staged build plan

#### v0 --- Local-first extension, no account/backend

Build a usable local extension first: - Manifest V3 extension skeleton -
Local category toggles - Local curated test blocklist - Domain/request
blocking using supported APIs - Safe Search setting where feasible -
Local block page - Basic false-positive placeholder/report action -
Local session timer and idle handling - Configurable 15/30/60
thresholds - Break/intervention UI - Small local activity suggestion
library - Extension popup/options/status UI - Local storage only

Acceptance criteria: - Installs and works with zero calls to a
Lumio-owned server. - Known test domains are blocked. - Safe Search
behavior works on supported search engines. - Interventions appear at
configured thresholds. - State survives browser restart. - No browsing
URLs are transmitted or stored remotely. - The extension clearly
communicates its protection status and limitations.

#### v1 --- Guardian account and policy synchronization

Only after v0 is working and verified: - Supabase Auth and PostgreSQL -
Guardian account - Protected profiles - Policy CRUD - Device
registration and secure pairing - Extension downloads authorized
policy - Local policy cache - Offline enforcement using last known valid
policy - Policy versioning - Minimal audit log for policy changes

Before v1, complete a privacy/legal review, decide data retention, and
approve a plain-language privacy notice.

#### v2 --- Dashboard and family management

Only after v1 is stable: - Guardian dashboard - Multiple
profiles/devices - Protection status and last sync - Aggregate wellbeing
trends - Category-level blocked counts - False-positive reporting
workflow - Optional faith module - Carefully defined, low-noise alerts

Do not build an alert for every ordinary screen-time threshold. Define
genuine safety events first.

#### Later

-   More Chromium browsers, then evaluate Firefox/Safari
-   Self-directed mode
-   Custom wellbeing schedules and focus mode
-   More verified rule intelligence
-   Mobile protection research
-   DNS/device/network protection
-   Family collaboration
-   Church/school/organization editions
-   Optional AI assistance where it demonstrably improves accuracy or
    usefulness

## 8. Suggested architecture and stack direction

The existing technical plan proposes:

-   **Browser extension:** TypeScript + Manifest V3
-   **Web app:** Next.js + TypeScript
-   **Backend:** Supabase (PostgreSQL + Auth)
-   **UI styling:** Tailwind CSS
-   **Charts:** add only when the dashboard phase requires them
-   **Shared types:** a shared TypeScript package
-   **Rules:** versioned local blocklist/rule packages

These are recommendations in the current Notion build plan, not
irrevocable choices. Claude Code should inspect current repository state
and verify current browser API constraints before implementing.

### Proposed repository layout

``` text
lumio-guard/
  extension/          # Manifest V3 browser extension
  web/                # Next.js guardian web app (v1+)
  supabase/
    migrations/       # SQL migrations and RLS policies
  packages/
    shared-types/     # Shared contracts/types
    blocklists/       # Curated and licensed rule data
  docs/               # Product, architecture, privacy, QA decisions
  README.md
  CLAUDE.md
```

The marketing landing page, if one exists, should remain separate from
the authenticated dashboard.

### Extension modules

``` text
extension/
  background/
    service-worker
    policy-manager
    sync-manager
    session-manager
    protection-health
  filtering/
    domain-rules
    request-rules
    redirect-protection
    safe-search
  wellbeing/
    activity-tracker
    timer
    threshold-manager
    intervention-controller
  ui/
    popup
    options
    block-page
    intervention
  storage/
    local-policy-cache
    session-state
    pending-sync-queue
```

The service worker can be suspended and restarted. Do not rely on an
always-running in-memory timer. Persist timestamps and minimal state so
session duration can be reconstructed after restarts.

### Backend direction for v1+

Use a **modular monolith**, not microservices.

Conceptual modules: - Auth - Guardians - Protected profiles - Policies -
Devices/pairing - Wellbeing aggregates - Safety aggregates -
False-positive reports - Rule distribution - Administration

Conceptual API groups: - `/api/v1/me` - `/api/v1/profiles` -
`/api/v1/profiles/:id/policy` - `/api/v1/profiles/:id/devices/pairing` -
`/api/v1/devices/pair` - `/api/v1/devices/heartbeat` -
`/api/v1/devices/:id/revoke` - `/api/v1/device/sync` -
`/api/v1/wellbeing/aggregates` - `/api/v1/safety/aggregates` -
`/api/v1/reports/false-positive` - `/api/v1/rules/manifest`

Exact routes can change; authentication, authorization, ownership
checks, and privacy constraints cannot.

## 9. Data model --- collect as little as possible

Potential core entities: - Guardian - ProtectedProfile - Device -
DeviceCredential - ProtectionPolicy - PolicyVersion - RulePackage -
WellbeingAggregate - SafetyAggregate - InterventionEvent -
FalsePositiveReport - SecurityEvent - Consent/Preference record

Potential aggregate fields: - Profile/device reference - Reporting
period/date - Active browser duration - Session count - Long-session
count - Intervention count - Break count - Optional broad activity
category - Blocked category/count

Do not store full browsing history for ordinary reporting. Do not send
every URL or browser request to the backend. Sensitive URL information
should not appear in ordinary analytics or logs.

Prefer this flow:

``` text
Local browser activity
  -> local session calculation
  -> local aggregate
  -> minimal aggregate sync
  -> guardian trend summary
```

Distinguish zero activity from missing data, delayed data, offline
devices, or unavailable data. Never present missing information as zero.

Retention periods are not yet finalized. They must be explicit,
approved, and implemented for account data, aggregates, security events,
reports, queues, and backups. Do not retain data indefinitely.

## 10. Security, privacy, and child safety

Required engineering controls: - HTTPS/TLS for all network traffic -
Secure token storage; never expose extension credentials to page
JavaScript - Short-lived, single-use pairing credentials where
practical - Credential revocation and rotation - Least-privilege browser
permissions - Strict input validation - Authorization on every protected
resource - Supabase Row Level Security for tenant isolation - No
trusting client-supplied guardian/profile IDs as proof of ownership -
Rate limiting on auth, pairing, sync, reports, and policy changes -
Idempotent sync operations - Safe policy/rule package validation and
integrity checks - Audit sensitive policy/security changes without
logging browsing content - Account deletion and device revocation
workflows - Encrypted, access-controlled backups with retention -
Dependency/security scanning - No production family data in ordinary
tests

Child-safety requirements: - Age-appropriate and respectful language -
Clear explanation of what guardians can see - Clear explanation of what
the extension measures - Appropriate guardian consent and young-person
transparency - No covert monitoring - No unnecessary collection of
sensitive behavioral data - Safeguarding procedures for any research or
testing involving minors

**Legal/compliance work is not complete merely because the app has a
privacy notice.** Before collecting real user data or launching, obtain
appropriate review for Nigeria's applicable data protection and
child-related requirements, and review requirements in every additional
market.

## 11. Content rules and filtering operations

Rules should be: - Categorized - Versioned - Integrity-checked - Tested
before publication - Reversible/rollback-capable - Updated without
reinstalling the extension

Filtering decision should consider: 1. Normalize the
destination/request. 2. Apply high-confidence block rules. 3. Apply
approved allowlist exceptions and precedence. 4. Evaluate supported
resource/request rules. 5. Allow or block according to a documented
fallback.

Maintain both false-positive and false-negative testing. Overblocking
legitimate health, education, support, or medical information is a
serious product defect. A false-positive review process is essential.

Blocklists must have a known source, license/usage rights, update
cadence, provenance, and quality review. Do not scrape or redistribute
lists without checking their terms.

Advertising protection is best-effort. Known inappropriate ad
domains/resources may be blocked; the extension cannot promise to
identify every explicit creative served from a legitimate ad network or
embedded on an otherwise safe page.

## 12. Wellbeing interaction details

Initial concept: - 15 minutes: "You've been browsing for a while. Would
you like to pause and check what you came here to do?" - 30 minutes:
encourage a short break or deliberate choice. - 60 minutes: stronger
reflection and a concrete break/activity suggestion.

These are example directions, not approved final copy. Use calm,
non-judgmental language. Provide configurable thresholds, cooldowns, and
a way to avoid repeated prompts. Track intervention outcomes in
aggregate, not detailed page history.

An activity suggestion library can include categories such as: - Move -
Create - Connect - Rest - Learn - Reflect (optional faith content only
when enabled)

Avoid turning the break screen into another infinite feed. Show a small
number of useful suggestions, with a simple refresh option.

## 13. Business model and pricing decisions already discussed

Existing Notion document: **29 --- Business, Pricing & Deployment
Strategy**.

Current hypothesis: mission-aligned freemium.

-   **Free:** meaningful core protection, basic Safe Search where
    supported, basic inappropriate-ad/redirect protection, basic
    wellbeing reminders, limited profile/device scope.
-   **Guard Plus (individual):** advanced filtering/intelligence, more
    devices, custom schedules, focus mode, advanced wellbeing controls
    and insights.
-   **Lumio Guard Family:** multiple profiles/devices, guardian
    dashboard, policies/schedules, privacy-conscious summaries and
    device management.
-   **Church/youth ministry:** future sponsored seats or organization
    plan.
-   **School/organization:** later, with separate administration and
    consent model.
-   **Sponsored access:** churches, ministries, NGOs, foundations, youth
    organizations, and individuals may sponsor access.

Pricing hypotheses for Nigeria---not final prices: - Guard Plus:
₦500--₦1,000/month - Family: ₦1,500--₦3,000/month - Annual discounts may
be tested.

Do not implement billing in the first local MVP. Validate value,
retention, support burden, infrastructure costs, and willingness to pay
first.

**Mission rule:** do not make the most important basic safety protection
unavailable merely because a family cannot afford premium.

## 14. Testing and release gates

Test: - Domain normalization and rule precedence - Allowed and blocked
destinations - Subdomains and URL encoding - Redirect chains - Safe
Search - Ad/resource blocking - False positives and false negatives -
Service-worker restart - Browser restart - Tab/window switching - Idle
time - Sleep/wake - 15/30/60 thresholds - Cooldowns and break
acceptance - Offline mode and sync retry - Invalid policy/rule package -
Device revocation - Cross-family authorization attempts - Token
exposure - XSS/injection and relevant web security risks - Privacy
leakage in logs/analytics - Accessibility and usability

Do not release with unresolved: - Critical security issue - Cross-family
authorization flaw - Sensitive-data leak - Critical protection
regression - Serious data-loss risk

Monitor crash/error rates, API failures, sync failures, policy update
failures, device health, false-positive spikes, and security events.

## 15. Roadmap priority

### NOW

-   One Chromium browser
-   Local-first extension foundation
-   High-confidence blocking
-   Basic Safe Search where feasible
-   Basic inappropriate-ad/resource and redirect protection
-   15/30/60 browser wellbeing interventions
-   Local break/activity suggestions
-   Clear status and limitations
-   Testing and privacy validation

### NEXT

-   Guardian account and secure pairing
-   Policy synchronization
-   Last-known-good offline policy
-   Basic dashboard and aggregate reporting
-   Multiple profiles/devices
-   False-positive reporting

### LATER

-   More browsers
-   Self-directed mode
-   Focus mode and custom schedules
-   Better rule intelligence
-   Mobile and device-level research
-   Family collaboration

### EXPLORE

-   Optional faith-oriented content
-   Church/youth ministry sponsorship
-   School/organization edition
-   AI-assisted classification or wellbeing recommendations, only when
    justified

## 16. Important unresolved decisions --- do not silently invent answers

Claude Code must surface these as decisions or use clearly marked
temporary defaults:

1.  Exact first browser (Chrome is the leading candidate, but confirm).
2.  Exact definition of "active browser use" and idle threshold.
3.  Whether time is accumulated per continuous session, per day, or
    both.
4.  Whether thresholds reset after a break and how long a break must be.
5.  Initial blocklist source, license, category taxonomy, update
    cadence.
6.  Rule precedence between guardian allowlist and safety blocklist.
7.  Exact categories included in MVP.
8.  Exact Safe Search support and limitations by search engine.
9.  What ad/resource blocking is technically feasible under Manifest V3.
10. What the extension can truthfully report about protection health.
11. Data retention periods and deletion lifecycle.
12. Guardian visibility boundaries.
13. Consent and age-appropriate onboarding model.
14. Nigeria-specific legal/compliance review and launch age range.
15. Whether v0 remains fully local-only (strong recommendation: yes).
16. When backend data collection is permitted to begin.
17. Whether the existing repository already contains work that must be
    preserved.

Do not assume an extension can measure total device screen time. Do not
claim that a browser extension prevents access in other browsers or
native apps.

## 17. Instructions for Claude Code

Before writing code:

1.  Inspect the existing repository and all project instructions.
2.  Identify existing code, package manager, framework, tests, and
    uncommitted changes.
3.  Read this handoff and the relevant detailed specifications.
4.  Report conflicts, missing decisions, and technical assumptions.
5.  Propose a small implementation plan with acceptance criteria.
6.  Work in small, verifiable milestones.
7.  Do not overwrite or restructure existing work without explaining
    why.
8.  Do not add backend, analytics, accounts, or network calls to v0.
9.  Do not add broad extension permissions without explaining and
    justifying each one.
10. Write tests for important logic and provide manual verification
    steps.
11. After each milestone, report files changed, tests run, results,
    limitations, and next step.
12. Stop at the requested milestone; do not silently continue into later
    phases.

### Initial Claude Code instruction

``` text
You are helping build Lumio Guard. First inspect the repository and read
CLAUDE.md and the project handoff document. Do not start coding immediately.

Summarize:
1. What already exists in the repository.
2. Which parts of the Lumio Guard handoff apply to the current code.
3. Conflicts or missing decisions.
4. The smallest sensible first milestone.
5. The files you expect to create or modify.
6. How you will test and verify the milestone.

The first target is v0: a local-first Manifest V3 Chromium extension.
It must have no Lumio-owned backend, no accounts, no remote analytics,
and no transmission of browsing URLs. Prioritize a reliable local
protection foundation and a browser-activity wellbeing prototype.

Do not claim universal protection or device-wide screen-time measurement.
Explain browser API limitations. Do not proceed until I approve the plan.
```

## 18. Existing Notion source documents

The following documents were found in the Lumio Guard workspace and
should remain the detailed source material. This handoff consolidates
the important direction; it does not replace their full technical
detail.

-   01 --- Product Vision & Overview
-   02 --- Product Requirements Document (PRD)
-   03 --- Problem Statement & Opportunity
-   04 --- User Personas & Use Cases
-   05 --- Product Principles & Philosophy
-   06 --- MVP Scope & Release Strategy
-   07 --- Product Roadmap
-   08 --- Technical Architecture & System Design
-   09 --- Database & Data Model
-   10 --- Content Classification & Filtering Strategy
-   11 --- Screen-Time & Digital Wellbeing Engine Specification
-   14 --- Digital Wellbeing & Screen-Time System
-   15 --- Authentication, Authorization & Account Security
    Specification
-   16 --- Browser Extension Architecture & Implementation Specification
-   17 --- Backend API & Service Specification
-   18 --- System Architecture / content rules and safety intelligence
    documentation
-   19 --- Data Model, Retention & Analytics Specification
-   20 --- Testing, QA & Security Validation Plan
-   21 --- MVP Scope, Development Phases & Delivery Plan
-   22 --- Product Roadmap, Priorities & Future Expansion Strategy
-   28 --- Security, Privacy & Child Safety
-   29 --- Business, Pricing & Deployment Strategy
-   Technical Build Plan v0 to v2
-   Privacy Notice --- Draft (plain language)

**Important:** Some Notion documents are working drafts, some are older
than the latest roadmap, and some topics overlap. If two documents
conflict, do not choose silently. Flag the conflict and use the latest
explicit product decision or ask for confirmation.

------------------------------------------------------------------------

## 19. Recommended immediate next step

Start with repository inspection, not code generation. Confirm whether
there is an existing codebase. If there is no codebase, create the
repository and implement only the first v0 milestone after the plan is
approved.

The first deliverable should be a small, testable extension---not a
complete platform.

**Definition of progress:** working, verified protection and wellbeing
behavior; not the number of screens or files generated.
