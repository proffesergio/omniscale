# Skills and MCP management

## Selection policy

Use the least additional tooling needed for the active task. Distinguish:

- application dependencies (for example, the Supabase SDK);
- agent skills (task instructions);
- MCP connections (agent access to external tools or data).

An application using Supabase does not inherently require Supabase MCP. This repository memory graph needs no MCP server.

## Skills available in the observed session

Recheck the current session's catalog before use; availability can change.

| Skill                               | Use when                                                           | Current disposition                                               |
| ----------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| openai-docs                         | Codex configuration, skills, MCP or OpenAI product guidance        | Used for this memory workflow's documentation                     |
| sites:sites                         | Website workflow or Sites hosting where applicable                 | Reviewed in main thread; preserve the user's chosen Next.js stack |
| imagegen                            | A task needs generated raster assets                               | Optional; current visuals are code-native                         |
| skill-creator                       | Creating or revising a reusable skill is requested/justified       | No custom skill created by this memory task                       |
| skill-installer                     | An actual skill installation is requested                          | No skill installed by this memory task                            |
| plugin-management:plugin-management | Discover/manage a needed plugin or unavailable external capability | Use only when a concrete gap warrants it                          |

The pets skills in the catalog are unrelated to this project.

Read the selected SKILL.md before following it, announce first use, and avoid loading unrelated skills. Do not copy complete skills into project memory. Prefer this project's lightweight AGENTS/workflow instructions until a repeated task warrants a dedicated skill.

## MCP proposal queue

No new server is currently required for maintaining these files. The following are conditional possibilities, not verified installations or pending permission requests.

| Capability                    | Trigger                                                                         | Minimum useful scope                                                                                | Fallback                                                   |
| ----------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Supabase inspection           | Need live schema/RLS diagnostics against the owner's chosen development project | Project-scoped read-only inspection first; migrations require separately scoped write authorization | Local migration review and owner-provided sanitized schema |
| Browser automation            | Need interactive browser QA unavailable through current tools                   | Local app only; no unrelated authenticated browsing                                                 | Existing Playwright/browser tooling                        |
| Official OpenAI documentation | Repeated Codex/OpenAI configuration work benefits from direct docs retrieval    | Public documentation reads                                                                          | Official documentation through web tools                   |
| Repository/CI integration     | A remote repository and PR/CI work become part of the task                      | Named repository and needed operations only                                                         | Local Git/CLI within authorized scope                      |
| External memory graph         | User explicitly needs memory shared beyond this repository                      | Explicit project namespace and data retention policy                                                | This repository's graph.json and Markdown                  |

## When to ask

- Discover existing tools and prior authorization before asking.
- For a newly needed MCP connection, identify the concrete task it enables, verified provider/source, proposed transport/configuration, permissions, data it can access, and a fallback.
- Ask before installing/connecting a new server or granting a new access scope. Do not imply an optional server is mandatory.
- For an already connected server, use it within the current task's authorized scope. Ask only for materially new access or an action requiring fresh authorization.
- Never request credentials in project files or chat logs. Use supported authentication/configuration flows.
- A timeout or silence is not approval. Continue independent local work where possible.
- Once authorized, record only the non-secret server identity, scope and connection status; verify connection success before calling it available.

Suggested question:

> To complete [specific task], may I connect/use [verified server] for [named project] with [specific permissions]? It will access [data]. The available fallback is [alternative].

Do not populate actual server endpoints from memory; verify official provider instructions when proposing installation.

## References

Checked 2026-10-14 using official OpenAI documentation:

- [Project instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [MCP configuration](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
- [Building skills](https://learn.chatgpt.com/docs/build-skills)

These references describe Codex capabilities. The maintenance and approval rules above are this project's workflow choices.
