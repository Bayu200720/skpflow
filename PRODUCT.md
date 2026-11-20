# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Undecided. Mockup-first; no implementation stack has been chosen yet.

## Users

- **ASN / pegawai (primary):** records daily work, links activities to performance targets, uploads supporting evidence, and produces monthly reports. Works across meetings, chat, documents, tickets, and technical tasks.
- **Atasan / pejabat penilai:** monitors team progress, reviews monthly reports, comments, requests revisions, and approves reports.
- **Admin:** manages users, roles, work units, supervisor hierarchy, activity categories, report templates, audit logs, and application settings.

## Product Purpose

SKPFlow helps Indonesian civil servants (ASN) record daily work, connect activities to performance targets, store supporting evidence, and generate editable monthly report drafts automatically. It reduces the burden of remembering and summarizing work at month-end.

## Positioning

A daily worklog that turns recorded activities into structured, editable monthly report drafts. It is not a replacement for the official performance assessment system; outputs are drafts for human review.

## Operating Context

Indonesian government agencies. Users work across meetings, chat, documents, tickets, and technical tasks. Monthly reports are prepared at month-end and reviewed by a direct supervisor. The prototype is a responsive web application for desktop and mobile.

## Capabilities and Constraints

**In scope (prototype):** authentication and role-based access; ASN and supervisor dashboards; daily activity CRUD; quick add with natural-language input and AI-assisted splitting; categories; performance targets; evidence attachments; weekly recaps; monthly report generator; AI writing assistant (editable output, no invented facts, mock fallback); report preview and export; supervisor review and comments; demo seed data; responsive desktop and mobile layout.

**Out of scope:** direct integration with e-Kinerja or official assessment platforms; automatic performance scoring; AI setting formal SKP targets; certified electronic signatures; payroll or national HR integration; fully configurable complex bureaucracy workflows; automatic data capture from email, calendar, chat, or ticketing systems.

## Brand Commitments

Name: **SKPFlow**. Tagline: *"Catat hari ini, susun kinerja tanpa repot."* Voice: practical, clear, supportive, professional. No visual identity was supplied; the mockup establishes a restrained, trustworthy government-utility direction.

## Evidence on Hand

- `PRD_SKPFlow_ASN.md` — product requirements.
- `PRD_ERD.md` — database entity-relationship diagram.
- `seed.sql` — PostgreSQL demo seed data.
- `mockup_dashboard.svg`, `mockup_mobile_add.svg` — first visual direction.

No real user research, testimonials, production metrics, or official agency branding assets.

## Product Principles

1. **Record first, polish later.** Capture work in seconds; improve the narrative afterward.
2. **Never invent facts.** AI may reorganize and suggest, but the user confirms every saved item.
3. **Connect activity to intent.** Every activity can be linked to a performance target.
4. **Make month-end cheap.** Recaps and report drafts come from data already recorded.
5. **Respect the official process.** Outputs are drafts for human review, not final assessments.

## Accessibility & Inclusion

No product-specific standard was confirmed. The mockup uses scalable text, theme-driven high-contrast colors, standard controls, and responsive layouts.
