# FAIR UI/UX Project Structure

This guide orients designers around FAIR’s end-to-end experience so UI/UX artifacts stay aligned with the product’s technical capabilities and workflows.

## Documentation Map

- `docs/quick start/SETUP_FAIR.md` – end-to-end environment setup, includes admin/voter flows and system checklists.
- `docs/quick start/API.md` – HTTP surface area for admin, voter, and results experiences.
- `docs/quick start/MIGRATIONS.md` – database evolution; useful when modeling new states or fields.

Use this README as the entry point for design context, then drill into the detailed guides above when specifying interactions that touch backend/API constraints.

## Experience Pillars

- Trust & Transparency – blockchain audit trail and single-use tokens reassure voters.
- Guided Operations – admins need wizard-like flows to configure hackathons, polls, judges, teams, and emails without ambiguity.
- Safeguarded Fairness – the UI must surface validations (self-vote exclusion, quorum, tie-breakers) before data hits the chain.
- Operational Awareness – dashboards surface state changes (invitations sent, quorum reached, AVAX usage) so admins act quickly.

## Primary Roles & Journeys

| Role | Goals | Critical Screens |
| --- | --- | --- |
| Super Admin | Bootstraps platform, oversees admins, audits activity | `app/super-admin/dashboard`, `app/super-admin/admins`, `app/super-admin/audit-logs` |
| Admin | Runs hackathons/polls, manages teams, invites voters/judges | `app/admin/login`, `app/admin/dashboard`, `app/admin/hackathons`, `app/admin/polls`, nested team/voter/judge editors |
| Judge/Voter | Authenticates via emailed token, casts vote, sees blockchain confirmation | `app/vote/page.tsx`, `app/vote/blockchain/[txHash]` |
| Public Viewer | Reads published results | `app/results/[pollId]` |

Design entry points should mirror these journeys to keep prototypes discoverable in tooling (e.g., Figma pages per role).

## Screen Inventory & Grouping

```
app/
├─ admin/…         # Internal operations (hackathons, polls, teams, judges, voters)
├─ super-admin/…   # Platform governance
├─ vote/…          # Token entry, validation, vote casting, blockchain receipt
├─ results/…       # Public poll summaries
├─ signup/         # External admin onboarding
└─ docs/ page      # In-app documentation (if enabled)
```

Use this tree to organize design files—match page names so engineers can correlate screens with routes quickly.

## Interaction Notes From Existing Docs

- `docs/quick start/SETUP_FAIR.md` outlines admin, voter, and super-admin workflows; reference it when defining step-by-step UI guidance, empty states, and confirmations.
- API resources in `docs/quick start/API.md` expose what data is available per screen (e.g., `/api/v1/admin/polls/[pollId]/teams` powers team tables and bulk actions).
- Migration history reveals domain changes such as hackathons, judges, tie-breaking, ranked voting—surface these as toggleable options or advanced settings in the UI.

## Design Tokens & System Hooks

- Color palette lives in `lib/design-system/colors.ts`, ensuring shared tokens with engineering.
- CSS variables and Tailwind theme bindings are declared in `app/globals.css`; fonts come from the Geist sans/mono pair set in `app/layout.tsx`.
- When documenting new tokens, update both the design kit and these source files to stay in sync.

## Deliverable Expectations

1. **Information Architecture** – sitemap reflecting role-based navigation.
2. **Flow Diagrams** – admin poll lifecycle, judge/voter token flow, auditing scenarios.
3. **Responsive Screen Specs** – desktop-first for admins, mobile-friendly vote/results.
4. **Design Tokens** – palette, typography, spacing scale matched to `globals.css`.
5. **State Library** – success, warning, error, loading, and blockchain pending states.

Track each deliverable against the relevant routes/APIs so stakeholders know what’s engineered versus conceptual.

## Collaboration Checklist

- Pair with engineering when toggling blockchain or email behaviors; these affect Brevo and Avalanche configurations documented in the setup guide.
- Flag new data requirements early so migrations can be scheduled.
- Include transaction hashes, token statuses, and permission cues in mockups to preserve the trust pillar.

Use this README as the top-level reference when kicking off or reviewing UI/UX work for FAIR.

