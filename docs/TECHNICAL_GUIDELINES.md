# Technical Guidelines

**Purpose:** This document is the primary context for architecture and conventions in this codebase. It should be read and followed whenever implementing or changing features.

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

## 6. Existing setup (reference)

- **tRPC context** (`src/server/api/trpc.ts`): Builds `ctx` with `db`, `auth`, and `services` (from `createServices(db)`).
- **UI primitives** (`src/components/ui/`): button, card, dialog, input, label, select, table, tabs, tooltip, etc. Use these and extend via variants before adding new primitives.
- **Theme:** `tailwind.config.ts` and `src/styles/globals.css` define `primary`, `secondary`, `tertiary` and other semantic colors; keep new UI aligned with these.

---

*Keep this file updated as we add new architectural decisions or conventions.*
