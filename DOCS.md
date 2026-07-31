# Documentation Index

**Consult this file before making any changes to the codebase.** It is the single entry point to all architecture, component, pattern, and skill documentation for Budgie.

---

## Coding Standards

The rules that apply to every file written or modified in this project.

- [Coding Standards](docs/coding-standards.md) — TypeScript conventions, naming, error handling, testing, libraries, module organization, and all technology-specific rules.

---

## Skills

Each skill doc defines a role, its responsibilities, what it owns, patterns to follow, and a checklist for quality. **Before working on a specific aspect of the app, read the relevant skill doc.**

| Skill | File | Scope |
|-------|------|-------|
| Frontend Designer | [docs/skills/skill-frontend-designer.md](docs/skills/skill-frontend-designer.md) | Reusable components, styling, variants, accessibility, animation. Owns `src/components/` and visual consistency. |
| Business Logic Engineer | [docs/skills/skill-business-logic.md](docs/skills/skill-business-logic.md) | Domain types, business rules, Result pattern, typed errors, server-side logic. Owns `src/server/` domain code and tRPC routers. |
| Edge Functions Expert | [docs/skills/skill-edge-functions.md](docs/skills/skill-edge-functions.md) | Serverless function patterns, webhook handling, event-to-DB mapping, idempotency. Applies to the Clerk webhook handler in `src/app/api/webhooks/`. |
| Reviewer | [docs/skills/skill-reviewer.md](docs/skills/skill-reviewer.md) | Linting, formatting, type-checking, build verification, test execution. Runs the quality pipeline and enforces standards. |

---

## Testing

- [Backend Unit Testing](docs/testing/backend-unit-testing.md) — conventions for unit tests: what to cover (happy path, auth failure, bad request), mocking, and structure.

---

## Reference

Third-party documentation snapshots for the technologies used in this project.

- [docs/reference/clerk/](docs/reference/clerk/) — Clerk auth: Next.js quickstart, core concepts, protecting content, CLI, MCP server, AI usage.
- [docs/reference/prisma/](docs/reference/prisma/) — Prisma with PostgreSQL quickstarts.
- [docs/reference/supabase/](docs/reference/supabase/) — Supabase guides (auth, TypeScript type generation, self-hosting).

---

## How to Use This Documentation

1. **Starting any work?** Read [Coding Standards](docs/coding-standards.md) first.
2. **Building a component?** Read [Frontend Designer](docs/skills/skill-frontend-designer.md).
3. **Adding business logic, types, or tRPC procedures?** Read [Business Logic Engineer](docs/skills/skill-business-logic.md).
4. **Working on webhooks or serverless handlers?** Read [Edge Functions Expert](docs/skills/skill-edge-functions.md).
5. **Writing backend tests?** Read [Backend Unit Testing](docs/testing/backend-unit-testing.md).
6. **Reviewing or finishing work?** Read [Reviewer](docs/skills/skill-reviewer.md) and run the checklist.

---

## Architecture Overview

```
budgie
├── src/                        # Next.js application
│   ├── app/                    # App Router (pages, layouts, API routes)
│   │   ├── (dashboard)/        # Main dashboard routes
│   │   ├── budgie/             # Budgie views
│   │   ├── invitations/        # Invitation flow
│   │   └── api/                # tRPC handler + Clerk webhook
│   ├── components/             # Shared reusable components (Frontend Designer)
│   ├── server/                 # Server-side code (Business Logic Engineer)
│   │   ├── api/                # tRPC root + routers
│   │   ├── emails/             # Resend email templates
│   │   ├── services/           # Server-side services
│   │   └── utils/              # Server utilities
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Preconfigured libraries (tRPC client, cn)
│   └── types/                  # Shared types
├── prisma/                     # Prisma schema + migrations
├── CLAUDE.md                   # Project overview, stack, and workflow rules
├── DOCS.md                     # This file — documentation index
└── docs/                       # All documentation
    ├── coding-standards.md
    ├── skills/
    ├── testing/
    └── reference/              # Clerk, Prisma, Supabase docs
```

### Data Flow

```
User → Next.js (App Router) → tRPC client → tRPC routers → Prisma → PostgreSQL
Clerk → Webhook POST (svix-verified) → src/app/api/webhooks/clerk → Prisma → PostgreSQL
Server → Resend → Transactional email (invitations)
```
