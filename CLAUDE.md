# Budgie

Budgie is a shared household budgeting app. Users create a "budgie" (a shared budget), invite contributors, and track monthly expenses, costs, contributions, and payment statuses per month.

## Documentation — read this first

**Before making any changes, consult [DOCS.md](DOCS.md).** It is the index to all coding standards, skill docs (frontend, business logic, review), testing guides, and third-party reference material in `docs/`. Read the coding standards and the skill doc relevant to your task before writing code.

## Stack

- **Next.js 14** (App Router) with React 18 and TypeScript
- **tRPC v11** for the API layer (`src/server/api/routers/`), consumed via TanStack Query
- **Prisma** with PostgreSQL (local DB runs via `docker compose`)
- **Clerk** for authentication (webhooks handled at `src/app/api/webhooks/clerk/`, verified with svix)
- **Tailwind CSS + shadcn/ui** for styling and components (`src/components/ui/`)
- **Resend** for transactional email (`src/server/emails/`)
- **Zod** for validation, **superjson** for tRPC serialization

## Commands

```bash
npm run dev              # Start dev server
npm run dev:lan          # Start dev server accessible on LAN
npm run build            # Production build
npm run lint             # ESLint
npm run db:docker:start  # Start local Postgres (docker compose up -d)
npm run db:studio        # Prisma Studio
```

## Project structure

```
src/
├── app/               # App Router pages, layouts, API routes
│   ├── (dashboard)/   # Main dashboard routes
│   ├── budgie/        # Budgie views
│   ├── invitations/   # Invitation flow
│   └── api/           # tRPC handler + Clerk webhook
├── components/        # React components (ui/ = shadcn primitives)
├── server/
│   ├── api/           # tRPC root + routers (budgie, month, expense, cost, ...)
│   ├── db.ts          # Prisma client
│   ├── emails/        # Resend email templates
│   ├── services/      # Server-side services
│   └── utils/         # Server utilities
├── lib/               # tRPC client setup, cn()
├── hooks/             # Shared React hooks
└── types/             # Shared types
prisma/                # schema.prisma + migrations
```

## Workflow rules

- **Prisma migrations are run by the user.** Only edit `prisma/schema.prisma`; never run `prisma migrate`, `prisma db push`, or `prisma generate` yourself.
- **shadcn/ui components are installed via the CLI** (`npx shadcn@latest add <component>`), never hand-authored. Never overwrite existing files in `src/components/ui/`.
