# OmniScale project memory

This folder preserves project context in reviewable repository files. It is not an external memory service.

| File                         | Purpose                                                   |
| ---------------------------- | --------------------------------------------------------- |
| [CURRENT.md](CURRENT.md)     | Current stage, implementation evidence, unresolved work   |
| [DECISIONS.md](DECISIONS.md) | Accepted and superseded product decisions                 |
| [graph.json](graph.json)     | Machine-readable modules, paths, status, and dependencies |
| [WORKFLOW.md](WORKFLOW.md)   | Resume, verification, and checkpoint procedure            |
| [TOOLS.md](TOOLS.md)         | Skill usage and MCP proposal policy                       |

## Codebase overview

Snapshot: 2026-10-15. Solid arrows describe implemented source relationships; dashed arrows describe external integration boundaries that still require live configuration. The main implementation checkpoint supersedes the original side-conversation inventory.

```mermaid
flowchart LR
  Home[Landing page] --> Calc[Calculator component and formulas]
  Home --> Gallery[Illustrative blueprint gallery]
  Calc --> Currency[Currency preference and suggestions]
  AuditUI[Validated audit wizard] --> AuditAPI[Audit API]
  BookingUI[Timezone-aware booking and calendar export] --> BookingAPI[Booking and availability APIs]
  AuditAPI --> Intake[Shared intake service]
  BookingAPI --> Intake
  Intake --> Validation[Zod validation]
  Intake --> Security[Origin checks and rate limiting]
  Intake --> DB[Supabase server adapter]
  Security --> DB
  Admin[Admin login and appointment controls] --> Auth[Auth helper and session proxy]
  Auth --> DB
  DB -.-> Schema[SQL migration: tested in embedded PostgreSQL]
  Schema --> Worker[Outbox worker with retry leases]
  Worker -.-> Providers[Email and webhook providers: not configured]
  Stripe[Private Stripe evidence module] -.-> StripeAPI[Approved live charges: not configured]
  Checks[Build, unit, database and browser checks] -.-> Release[Deployment: not started]
```

The graph tracks feature boundaries rather than every import. Its `paths` list means files were observed; `missingPaths` means they were absent at inspection, not that the chosen filename is mandatory.

## Resume prompt

> Resume OmniScale from AGENTS.md and docs/project-memory/CURRENT.md. Reconcile the checkpoint with the current files, preserve accepted decisions, and continue the next unfinished authorized task. Update the tracker and dependency graph after verification. Propose an MCP connection only when an actual capability gap requires it.

Use this in the main project conversation. This memory-setup side conversation does not resume application development.
