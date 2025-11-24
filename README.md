# EntryPoint SRM

This is the web application for [EntryPoint SRM](https://entrypointsrm.com). This README contains basic information necessary to get the project running locally and manage database migrations. Further technical documentation can be found in our [Confluence](https://entrypointsrm.atlassian.net/wiki/spaces/Tech/overview?homepageId=10256515)

## Technical Stack

### Core Technologies
- [Next.js](https://nextjs.org/docs) - React framework for production
- [TypeScript](https://www.typescriptlang.org/docs/) - Type-safe JavaScript
- [Supabase](https://supabase.com/docs) - Open source Firebase alternative which runs [PostgreSQL](https://www.postgresql.org/docs/)
- [AI SDK](https://ai-sdk.dev/) - Typescript AI abstraction and tooling library
- [OpenAI](https://platform.openai.com/docs/overview) - The underlying AI provider
- [ShadCN](https://ui.shadcn.com/) - UI component framework


### Key Features
- Supabase database/user auth
- Row Level Security (RLS) for data access control
- Type-safe database operations with Drizzle
- Server-side rendering with Next.js


## Project Setup Instructions

Follow these steps carefully to clone and run the project locally using Docker. This is the recommended approach for all development.

### Prerequisites
- **Docker Desktop**: Ensure Docker Desktop is installed and running. [Download here](https://www.docker.com/products/docker-desktop/).
- **Supabase CLI**: Ensure you have the Supabase CLI installed locally. [Installation guide](https://supabase.com/docs/guides/cli/getting-started).
- **Node.js & npm**: Required for running helper scripts and for local development tooling.

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone <your-repository-url>
cd <project-folder>
```

### 2. Install Local Dependencies

Run `npm install` to install dependencies on your host machine. This is required for local tooling (IDE support, linting) and to run the necessary setup scripts. The application itself will use dependencies installed inside the Docker container.

```bash
npm install
```

### 3. Initialize and Start Supabase

Run the local Supabase environment, if it's not already running. This uses the Supabase CLI to start all the necessary services in Docker.

```bash
supabase start
```

This will start Supabase locally and provide you with the values needed for the next step.

### 4. Set Up Environment Variables

This project uses a `.env.local` file to manage environment variables.

- **Create the file**: In the project root, copy `.env.local.example` to `.env.local`.
- **Populate the values**: Fill in the `.env.local` file with the values provided by the `supabase start` command:

```dotenv
SUPABASE_URL=<api-url>
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service_role key>
DATABASE_URL=<DB-url>
```

Obtain an OpenAI API key from Matt Rogers and add it as well:
```dotenv
OPENAI_API_KEY=<some-long-key>
```

### 5. Launch the Development Environment

Build the development Docker image and start the application container:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- `-f docker-compose.dev.yml`: Specifies that we are using the development configuration.
- `--build`: Rebuilds the image. Run this the first time and anytime you change dependencies in `package.json`.

The application will now be running with hot-reloading at [http://localhost:3000](http://localhost:3000).

By default, this will use `.env.local` for environment varaibles. If you want to run with a different set of env vars, simply change the `ENV_FILE` value:

```bash
ENV_FILE=.env.development docker compose -f docker-compose.dev.yml up --build
```

**NOTE:** You can still run the application without Docker using `npm run dev`, and build it with `npm run build`.

### 6. Create a Production-Ready Build

To create a production-ready build (emulating what happens in our CI/CD process), you use the main `docker-compose.yml` file. The environment to use is controlled via a shell variable, `ENV_FILE`.

```bash
ENV_FILE=.env.development docker compose up --build
```

- This command sets the `ENV_FILE` variable for this session, which is then used by `docker-compose.yml` to load the correct environment file.
- If `ENV_FILE` is not set, it will default to `.env.local`.

### 7. Reset and Seed the Database

This command must be run from your host, not inside the container.

```bash
npm run reset
```

This will apply all database migrations and run the seed scripts. The initial seeded user is `test@email.com` with a password of `password`.

Your local environment should now be ready!


## Development Workflow

Most scripts/commands, such as running tests or database migrations, should be executed inside the Docker container to ensure a consistent environment.

### Running Commands in the Container

There are two primary ways to run commands inside a container. The service name is `webapp` for both the development and the production container (differentiated by the compose file used).

1.  **Directly with `exec`**: 
    ```bash
    ENV_FILE=.env.local docker compose -f docker-compose.dev.yml exec webapp <your-command>
    ```
2.  **Using an interactive shell**: With the container running, in aother termianl run the command below to get a shell. You can then run your commands (e.g., `npm run test`). Type `exit` to return to your host machine.
      ```bash
      docker compose exec webapp sh
      ```

### Pull requests
Before opening a pull request, check:
1. Does the production build execute successfully? (`ENV_FILE=.env.development docker compose up --build` or `npm run build`)
2. Have migrations been generated and have you tested them against a reset copy of your local database?

#### PR Validation and Changesets
- Every PR runs the **PR Validation** workflow (see `.github/workflows/pr-validation.yml`).
- A changeset is required for each PR. Generate one with `npm run changeset` and commit the file in `.changeset/`.
- If a PR truly does not need a release note (docs/chore-only), apply the `no-changeset` label to bypass the check.

### Database Changes
We use [Supabase Migrations](https://supabase.com/docs/guides/deployment/database-migrations#diffing-changes) to manage the database schema. **All changes to the database should be made in a local instance of the database.** Do _not_ modify a hosted environment database (e.g. `Dev`) without explicit permission to do so from the project lead.

The development process is as follows. The below shell commands should be run from the root of your local project.

1. Before starting new work, run `npm run reset` to ensure your database structure and `db.types.ts` file is clean. This will:
   * Clear your local database
   * Apply Supabase migration files from `supabase/migrations/*.sql`
   * Load seed data from `supabase/seeds/*.sql`
   * Create users using `supabase/seed-user.ts`
   
   At this point, your local database should now reflect the scehma of the `Dev` database.
1. For your feature, make changes to your **local database** directly (via direct postgres connection in your favorite db editor or the supabase local admin web UI, usually at http://localhost:54323).
1. (Optional) If you need updated TS Type definitions during app development, run:
   ``` bash
   # writes types file to (src/types/db.types.ts)
   npm run supabase:gentypes
   ```
      * Do not edit `db.types.ts` directly. You can modify `src/types/Models.ts` if you require convenience type definitions or need to modify generated types. See [Generating Typscript Types](https://supabase.com/docs/guides/api/rest/generating-types) for more info.
1. During development of your feature, if `main` is updated with additional migrations and you need to apply those locally, merge `main` into your branch and run `supabase migration up`.
1. When your feature is complete, generate the migration file:
   ``` bash
   # generate migration sql file in supabase/migrations
   npm run supabase:genmigration -- NAME_OF_MIGRATION
   ```
   where name `NAME_OF_MIGRATION` includes your ticket name(s) or branch name (e.g. `DEV-247-student-current-grades`). If you want to do a "dry run" and see the diff without generating the migration file, run `supabase db diff --debug`.

   After generating the migration file, **look at it** and make sure it contains what you expect. If it contains changes that you did not make, **stop** and figure that out. 
1. Commit and push your changes. For database related changes you should keep your eye on updates to:
   * `src/types/db.types.ts`
   * `src/types/Models.ts`
   * `supabase/migrations/*`

### Loading data from a remote database
It can be helpful to bring in data from a higher environment to troubleshoot/test application behavior. You can use the following `npm` command to help with this:

```bash
npm run supabase:restorefromremote
```

This will use the Supabase CLI to:
1. Link to a remote database (you may be asked to log in) — you will select from a list of DBs you have access to
1. Dump the data (only) to `supabase/backups/remote-data.sql`
1. Reset (clear) the local Supabase database, which will apply all migrations in the `supabase/migrations` folder
1. Load the `remote-data.sql` file into your local database.


> NOTES:
> 1. This command assumes you have a `.env.local` file with your local database connection string in `DATABASE_URL`.
> 2. This process will only work if the local schema matches the remote schema at the time of import.


You can instead _just_ reset/reload your local database from the existing `remote-data.sql` file (without having to wait for the remote dump, which also saves us on egress bandwidth) by running:

```bash
supabase db reset && npm run supabase:loadtolocal
```

### Database Backup and Restore

**Note**: These commands require PostgreSQL client tools (`pg_dump`, `pg_restore`) to be installed on your host machine.

#### Backup the Database

To create a backup of your current database state, run:

```bash
npm run db:backup
```

- This command executes the script at `supabase/backup-data.ts`.
- The backup file will be saved in the `supabase/backups/` directory.

#### Restore the Database

To restore your database from a backup, run:

```bash
npm run db:restore
```

- This command executes the script at `supabase/restore-data.ts`.
- **Warning**: This will overwrite existing data in your database.

## Analytics Events

The app sends a limited set of Mixpanel events (page views, students table interactions, saved report activity) using a privacy-first, low-cardinality convention. Only structural metadata (e.g. which columns were filtered) is tracked—never raw filter values, student names, or IDs.

For the full catalog of current events, naming rules, and how to add new ones safely, see `docs/analytics-events.md`.

Quick principles:
- Object + verb style names (e.g. `Students Export`, `Report Opened`).
- No PII; collapse dynamic IDs.
- Use minimal boolean / count properties.
- Update the analytics doc when introducing a new event.
