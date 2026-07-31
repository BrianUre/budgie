# Clerk CLI

The Clerk CLI is a command-line tool for you and your agents to set up and manage [Clerk](https://clerk.com/) authentication directly from the terminal. It supports 10+ frameworks.

## Installation

Install the CLI globally, or run it directly without installing using `npx clerk` or `bunx clerk`.

**npm**

filename: terminal
```bash
$ npm install -g clerk
```

**pnpm**

filename: terminal
```bash
$ pnpm install -g clerk
```

**yarn**

filename: terminal
```bash
$ yarn global add clerk
```

**bun**

filename: terminal
```bash
$ bun add -g clerk
```

**Homebrew**

filename: terminal
```bash
$ brew install clerk/stable/clerk
```

**curl**

filename: terminal
```bash
$ curl -fsSL https://clerk.com/install | bash
```

## Get started

Run `clerk init` in your project directory to get started:

filename: terminal
```bash
$ clerk init
```

This command auto-detects your framework, installs the appropriate Clerk SDK, and applies framework-specific setup such as auth pages, middleware, and providers. If you're authenticated with `clerk auth login`, it also links your project to a Clerk application and pulls your environment variables automatically.

You can also use `clerk init --starter` to bootstrap a brand new project from a starter template, or run `clerk init` without an account to get started immediately with temporary development keys.

## What you can do

- **Set up authentication** — `clerk init` detects your framework, installs the SDK, and scaffolds your project with Clerk's authentication setup.
- **Manage environment variables** — `clerk env pull` pulls your Clerk API keys into your project's env file.
- **Configure your instance** — `clerk config pull` and `clerk config patch` let you manage your Clerk instance's auth settings as code.
- **Deploy to production** — `clerk deploy` walks you through promoting a Clerk app from development to production: registering your domain, configuring DNS, and gathering OAuth credentials. Use `clerk deploy status` to verify deploy completeness.
- **Access the Clerk API** — `clerk api` is an authenticated client for Clerk's [Backend API](https://clerk.com/docs/reference/backend/overview.md). Run `clerk api ls` to explore available endpoints.
- **Run diagnostics** — `clerk doctor` validates your project's Clerk integration and flags common issues.
- **Manage applications** — `clerk apps list` and `clerk apps create` let you view and create Clerk applications from the terminal.
- **Open the Dashboard** — `clerk open` launches the [Clerk Dashboard](https://dashboard.clerk.com) in your browser from the terminal.
- **Update the CLI** — `clerk update` updates the CLI to the latest version.

Run `clerk --help` for a full list of commands.

## AI agent integration

The CLI is designed to work seamlessly with AI coding agents:

- **Automatic agent detection** — The CLI auto-detects agent vs. human mode. Non-TTY environments default to agent mode, or you can set it explicitly with `--mode agent`.
- **Agent-friendly setup** — `clerk init -y` runs the full setup non-interactively, skipping all confirmation prompts, which is ideal for AI agents.
- **Read-only production status** — `clerk deploy --mode agent` returns a JSON snapshot of your production instance's configuration state so your AI agent can inspect progress and recommend next steps.
- **Clerk Skills** — Accept the optional prompt during `clerk init` (which installs Clerk's agent skills, including `clerk-cli`), or run `npx skills add clerk/skills` anytime, to install [Clerk Skills](https://clerk.com/docs/guides/ai/skills.md) — giving your AI agent deeper knowledge about Clerk's SDKs and patterns.

## Frequently asked questions (FAQ)

### What can't the CLI do?

The CLI handles project setup, configuration, and API access. For user management, analytics, and other advanced features, use the [Clerk Dashboard](https://dashboard.clerk.com) directly.

### Which frameworks are supported?

The CLI supports frameworks such as Next.js, React, Vue, Nuxt, Astro, React Router, TanStack Start, and more. Some frameworks like Expo, Express, and Fastify are supported for SDK installation but don't yet include full scaffolding. Run `clerk init --help` for the current list.

### Is it open source?

Yes. The CLI is open source and available on [GitHub](https://github.com/clerk/cli).

### How do I report a bug?

Open an issue on the [GitHub repo](https://github.com/clerk/cli/issues) or [contact support](https://clerk.com/contact/support).

### How do I request a feature?

Submit feature requests on Clerk's [public roadmap](https://feedback.clerk.com/roadmap).
