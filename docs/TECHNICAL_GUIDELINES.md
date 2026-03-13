# Technical Guidelines

**Purpose:** This document is the primary context for architecture and conventions in this codebase. It should be read and followed whenever implementing or changing features.

**Guidelines vs current state:** This repo was not started with these guidelines written down. Much of the existing code does not yet conform. The sections below describe the **target** architecture and conventions. When working in the codebase—especially when creating or updating **plans**—treat the guidelines as the desired state, not a description of the current state.

**Using this document for planning:** When building or executing plans, identify places where the current implementation **differs** from these guidelines and **highlight** them to the user. The work may involve **changing** existing code to conform, not only adding new code. When you encounter non-conforming code (e.g. hand-written types instead of derived ones, logic in routers, etc.), **surface it** and **ask the user**:
- **Option A:** Refactor by root so the area conforms to the guidelines now.
- **Option B:** Temporarily follow or expand the current (non-conforming) pattern and schedule a separate refactor or “conformance pass” in a later plan.

Do not assume one or the other; present the deviation and ask.

---

## 1. Variable and symbol naming

- **Prefer readable names:** Use 1–4 full words for variables, functions, and types.
- **Shorten sparingly:** Abbreviate or shorten only when the full name would be unreasonably long (e.g. in tight loops or when a short name is widely understood in context).
- **Avoid unnecessary abbreviations:** Prefer `contributorList`, `selectedMonthId`, `invitationToken` over `cl`, `smId`, `tok` unless the long form is clearly excessive.

---

## 2. Documentation comments (JSDoc)

Add comments on **classes**, **props** (and their types/interfaces), and **methods** so that IDEs show useful documentation on hover.

- **Use JSDoc/TSDoc:** Place a comment block immediately above the declaration. The first line is the summary; use `@param` and `@returns` (or `@return`) where they add clarity.
- **Classes:** Briefly describe the responsibility of the class and when to use it.
- **Props / interfaces:** Describe the purpose of the component or type and, for each property, what it controls or represents.
- **Methods / functions:** One-line summary is often enough; add `@param` for non-obvious arguments and `@returns` when the return value is not obvious from the name.

Example:

```ts
/**
 * Loads and manages invitation state for a budgie. Use for listing and creating invites.
 */
export class InvitationService {
  /**
   * Creates a new invitation and returns its token. Does not send email.
   * @param budgieId - The budgie to invite to
   * @param inviteeEmail - Email address of the invitee
   * @returns The new invitation record and the token for the invite link
   */
  async createForBudgie(budgieId: string, inviteeEmail: string, ...) { ... }
}
```

- **Public API first:** Prioritize comments for exported components, service methods, and shared types; internal helpers can be briefer or omitted when the name is self-explanatory.

---

## 3. UI and design: shadcn + Tailwind

### 3.1 shadcn as the design framework

- **Default to shadcn:** New UI components should use shadcn when possible. Check `src/components/ui/` before adding net-new primitives.
- **Non-destructive adoption:** When adding shadcn components (e.g. via CLI or copy), do not break existing styling or layout. Integrate with current patterns and tokens.
- **Respect existing styling:** Use the project’s Tailwind theme (primary, secondary, tertiary, etc.) and existing component variants. Do not introduce one-off colors or styles that bypass the design system.

### 3.2 Colors and theme

- **Use semantic Tailwind classes:** Prefer `primary`, `secondary`, and `tertiary` (and their `-foreground` / `-hover` variants) over raw color values or ad-hoc classes.
- **Examples:** `text-primary`, `bg-secondary`, `text-tertiary`, `hover:text-primary-hover`, `ring-primary`, `bg-primary/10`.

### 3.3 Component reuse and variants

- **Prefer variants over duplication:** When the same component is used in multiple ways (e.g. different emphasis or states), add a `variant` (and optionally `size`) via something like `cva` (class-variance-authority) instead of copying component code or inline class strings.
- **Shared patterns:** If a pattern repeats (e.g. “card with header + actions”), consider a small wrapper or a variant on an existing UI component rather than new one-off markup.

---

## 4. Forms and tables: TanStack + shadcn

- **Forms:** Use **TanStack Form** (`@tanstack/react-form`) for form state and validation. Compose with shadcn form primitives (e.g. `Input`, `Label`, `Button`) so that styling stays consistent.
- **Tables:** Use **TanStack Table** (`@tanstack/react-table`) for table state, sorting, and structure. Render with shadcn `Table` components (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, etc.) so that tables look and behave consistently across the app.

---

## 5. Data access and server architecture

### 5.1 All data access through tRPC

- **Single entry point:** All server-side data access and mutations go through **tRPC procedures**. The frontend (and any server components that need data) call tRPC; they do not talk to the database or services directly.
- **Routers:** Live under `src/server/api/routers/`. Each router defines procedures (queries/mutations) that delegate to the **service layer** via `ctx.services`.

### 5.2 tRPC procedures (routers) are thin

- **No business logic in routers:** Procedure handlers should only:
  - Validate input (e.g. with Zod).
  - Call one or more methods on `ctx.services.*`.
  - Map service errors to `TRPCError` when appropriate.
  - Return the result (or a simple transformation of it).
- **No extra dependencies in routers:** Routers must **not** import:
  - The database (`db`) or Prisma client.
  - Service classes or other business-logic modules.
- **Allowed in routers:** Imports from `zod`, `@trpc/server`, and the local tRPC setup (e.g. `createTRPCRouter`, `protectedProcedure`, `publicProcedure`). Context is used to access `ctx.services` and `ctx.auth`.

### 5.3 Service layer owns logic and database access

- **Location:** Services live in `src/server/services/`. They are created in `createServices(db)` and attached to the tRPC context as `ctx.services`.
- **Responsibilities:**
  - All database access (Prisma) happens inside service methods.
  - Business rules, validation that depends on DB state, and cross-entity workflows live in services.
  - Services may use other services (injected via `createServices`) when needed; routers do not orchestrate between services beyond calling them.
- **Routers call services:** A typical procedure gets `ctx`, validates `input`, then calls something like `ctx.services.budgie.getById(input.id)` or `ctx.services.invitation.accept(input.token, ctx.auth.userId)` and returns the result.

### 5.4 Summary flow

```
Client / React components
    → tRPC client (e.g. api.budgie.getById.useQuery)
        → tRPC procedure (router)
            → ctx.services.<domain>.<method>(...)
                → Service class
                    → this.db (Prisma) / other services
```

- **Routers:** Thin; only zod, tRPC, and `ctx.services` / `ctx.auth`.
- **Services:** All logic and DB access; no HTTP or tRPC concepts.

---

## 6. Types for database and API objects

Prefer **derived** types over hand-written interfaces so types stay in sync with the schema and procedures. Do not duplicate DB/API shapes as manual interfaces unless there is a clear reason (e.g. a deliberate subset or view for a specific UI).

- **Client usage (React, hooks, client components):** Derive types from **tRPC**. Use the app’s tRPC type helpers (e.g. `RouterOutputs`, `RouterInputs`) keyed by router and procedure. Example: the type for “budgie returned by getById” is `RouterOutputs['budgie']['getById']`. This matches exactly what the client receives and stays correct when procedures or services change.
- **Server usage (services, server-only code):** Derive types from the **service layer** and **Prisma**. Use the return types of service methods, or Prisma’s generated types (e.g. `Prisma.BudgieGetPayload<{ include: { … } }>`) where the service returns Prisma output. Services own the DB; types for DB-backed objects on the server should come from there, not from hand-coded interfaces.
- **Where to declare derived types:** When you export a type alias for a procedure’s output or input (e.g. `export type BudgieByIdOutput = RouterOutputs['budgie']['getById']`), **declare it in the router file that owns that procedure** (e.g. `src/server/api/routers/budgie.ts`). Consumers import the type from that router module. Do not declare tRPC-derived types in random components, utils, or other files; keeping them in the router keeps the type co-located with the procedure and makes the API surface easy to find.

When you see hand-written interfaces or inline object types that describe DB or API shapes, treat that as a deviation from these guidelines (see **Using this document for planning** above): highlight it and ask whether to refactor to derived types now or to follow the current pattern and fix in a later plan.

---

## 7. Renaming files (Git)

- **Use `git mv` when renaming or moving files:** Prefer `git mv <old-path> <new-path>` instead of renaming in the editor or filesystem and then staging the result. Git records the change as a rename, so history and blame (e.g. `git log --follow`, `git blame`) stay correct and diffs are clearer.

---

## 8. Existing setup (reference)

- **tRPC context** (`src/server/api/trpc.ts`): Builds `ctx` with `db`, `auth`, and `services` (from `createServices(db)`).
- **UI primitives** (`src/components/ui/`): button, card, dialog, input, label, select, table, tabs, tooltip, etc. Use these and extend via variants before adding new primitives.
- **Theme:** `tailwind.config.ts` and `src/styles/globals.css` define `primary`, `secondary`, `tertiary` and other semantic colors; keep new UI aligned with these.

---

*Keep this file updated as we add new architectural decisions or conventions.*
