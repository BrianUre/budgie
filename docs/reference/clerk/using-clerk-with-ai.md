# Using Clerk with AI

Clerk helps you build AI-powered applications with secure authentication. Whether you're using AI coding tools to build with Clerk, or building a Model Context Protocol (MCP) server that lets AI agents access user data, these guides cover everything you need to get started.

## Skills

Clerk Skills are installable packages that give AI coding agents specialized knowledge about Clerk. Once installed, agents can help you add authentication, manage Organizations, sync users, and more.

```bash
npx skills add clerk/skills
```

Works with most agents including Claude Code, Cursor, Windsurf, GitHub Copilot, Codex, Gemini CLI, and more. See the [dedicated guide](https://clerk.com/docs/guides/ai/skills.md) for available Skills and installation options.

## CLI

The Clerk CLI lets you and your AI agents set up and manage Clerk authentication directly from the terminal — installing the SDK, pulling environment variables, configuring your instance, and deploying to production. It auto-detects agent vs. human mode, and `clerk init` can install Clerk Skills for your agent.

```bash
npx clerk@latest init
```

See the [CLI guide](https://clerk.com/docs/cli.md) for installation and all available commands.

## Use Clerk's MCP server

Clerk provides its own MCP server that helps AI coding agents provide accurate SDK snippets and implementation patterns. This is useful when building authentication features with Clerk in AI tools. Learn how to [connect to Clerk's MCP server](https://clerk.com/docs/guides/ai/mcp/clerk-mcp-server.md).

## Build your own MCP implementation

An MCP implementation involves two parties: a "client" and a "server". In web development, the terms "client" and "server" often refer to the frontend (browser) and backend (web server). However, in the context of MCP, these terms have different meanings:

- The "client" is the LLM application that wants to access another service on a user's behalf. For example, Claude would be the "client" if it wants to get access to Gmail.
- The "server" is the system that hosts the protected resources the client wants to access. In this example, this would be Gmail. This is sometimes referred to as the "resource server" or "MCP server".

Clerk supports MCP through dynamic client registration (for registering MCP servers programmatically), consent screens (for secure user authorization), and SDK support, making it an ideal authorization server for MCP implementations.

To learn how to implement both sides of the flow using Clerk, refer to the following guides:

- [Build an MCP server](https://clerk.com/docs/guides/ai/mcp/build-mcp-server.md)
- [Connect an MCP client](https://clerk.com/docs/guides/ai/mcp/connect-mcp-client.md)

## Agent Tasks

Agent Tasks allow you to create authenticated sessions on behalf of users without going through the standard sign-in flow. This is useful for AI agent workflows where an agent needs to act on behalf of a user. Read the complete [Agent Tasks guide](https://clerk.com/docs/guides/development/testing/agent-tasks.md).

## AI prompts

Clerk's AI prompt library provides curated prompts to help you work more efficiently with AI-powered development tools like Cursor, Claude Code, Codex, GitHub Copilot, and more. These prompts guide AI assistants in helping you implement Clerk's features correctly.

To learn more, see the [AI prompts](https://clerk.com/docs/guides/ai/prompts.md) guide.
