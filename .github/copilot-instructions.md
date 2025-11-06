# Copilot Instructions for EntryPoint SRM Webapp

This guide provides essential context for AI coding agents working in the EntryPoint SRM web application codebase. Follow these conventions and workflows to maximize productivity and maintain project standards.

## Architecture Overview
- **Framework**: Next.js (React, TypeScript)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Backend**: API routes in Next.js, database access via Supabase client
- **ORM**: Supabase client with generated TypeScript types
- **Containerization**: Docker for local dev and production
- **Styling**: Tailwind CSS with ShadCN components
- **Auth**: Supabase user authentication
- **AI Integration**: Uses AI SDK and OpenAI for AI features
- **UI**: ShadCN component library

## Key Directories & Files
- `src/app/` — Main Next.js app code (pages, API routes)
- `src/components/` — React UI components
- `src/types/` — TypeScript types, including generated DB types (`db.types.ts`)
- `supabase/migrations/` — Database migration SQL files
- `supabase/backup-data.ts`, `restore-data.ts` — DB backup/restore scripts
- `.env.local` — Main environment config (copy from `.env.local.example`)
- `docker-compose.dev.yml`, `docker-compose.yml` — Dev/prod container configs

## Development Workflow
- **Local Dev**: Use Docker (`docker compose -f docker-compose.dev.yml up --build`) for consistent environment
- **Supabase**: Start with `supabase start` and set env vars from its output
- **Database Migrations**:
  - Reset DB: `npm run reset` (applies migrations, seeds data)
  - Generate migration: `npm run supabase:genmigration -- <NAME>`
  - Update TS types: `npm run supabase:gentypes` (do not edit `db.types.ts` directly)
- **Testing**: Run tests inside the container (`docker compose exec webapp npm run test`)
- **Backup/Restore**: Use `npm run db:backup` and `npm run db:restore` (requires `pg_dump`/`pg_restore` on host)

## Project-Specific Conventions
- **Database Types**: Only update `src/types/db.types.ts` via codegen; extend types in `Models.ts` if needed
- **Migration Naming**: Use ticket/branch names in migration filenames
- **Environment Files**: Use `ENV_FILE` shell variable to switch env configs
- **Seed Data**: Initial user is `test@email.com` / `password`
- **Auth/Access**: RLS policies exist on tables; use Supabase client with authenticated user context ONLY in the application code
- **Error Handling**: Implement robust error handling and logging for all API routes

## Integration Points
- **AI Features**: See usage of AI SDK and OpenAI in `src/libs/` and API routes
- **External Services**: Supabase CLI, Docker, PostgreSQL client tools

## Common Pitfalls
- Always run DB migrations and type generation before pushing changes
- Do not edit generated types directly
- Run commands inside Docker for consistency
- Don't look at migration files to understand DB schema; look at the database (using the Supabase MCP server if you have access to it)

## Example Commands
- Start dev: `docker compose -f docker-compose.dev.yml up --build`
- Reset DB: `npm run reset`
- Generate migration: `npm run supabase:genmigration -- DEV-123-add-feature`
- Update types: `npm run supabase:gentypes`
- Run tests: `docker compose exec webapp npm run test`

---
If any section is unclear or missing, please provide feedback so this guide can be improved for future AI agents.
