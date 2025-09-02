# EntryPoint SRM

This is the web application for [EntryPoint SRM](https://entrypointsrm.com). This README contains basic information necessary to get the project running locally and manage database migrations. Further technical documentation can be found in our [Confluence](https://entrypointsrm.atlassian.net/wiki/spaces/Tech/overview?homepageId=10256515)

## Technical Stack

### Core Technologies
- [Next.js](https://nextjs.org/docs) - React framework for production
- [TypeScript](https://www.typescriptlang.org/docs/) - Type-safe JavaScript
- [Supabase](https://supabase.com/docs) - Open source Firebase alternative which runs [PostgreSQL](https://www.postgresql.org/docs/)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) - TypeScript ORM
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
NEXT_PUBLIC_SUPABASE_URL=<api-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_KEY=<service_role key>
DATABASE_URL=<DB-url>
```

Obtain an OpenAI API key from Matt Rogers and add it as well:
```dotenv
OPENAI_API_KEY=<some-long-key>
```

### 5. Launch the Development Environment

Build the development Docker image and start the application container. The `--env-file` flag is required to correctly load variables during the build process.

```bash
docker-compose --env-file .env.local -f docker-compose.dev.yml up --build
```

- `--env-file .env.local`: Explicitly tells Docker Compose which environment file to use.
- `-f docker-compose.dev.yml`: Specifies that we are using the development configuration.
- `--build`: Rebuilds the image. Run this the first time and anytime you change dependencies in `package.json`.

The application will now be running with hot-reloading at [http://localhost:3000](http://localhost:3000).

**NOTE:** You can still run the application without Docker using `npm run dev`, and build it with `npm run build`.

### 6. Reset and Seed the Database

With the container running, open a **new terminal window** and run the database reset script inside the container:

```bash
docker-compose --env-file .env.local -f docker-compose.dev.yml exec webapp-dev npm run reset
```

This will apply all database migrations and run the seed scripts. The initial seeded user is `test@email.com` with a password of `password`.

### ✅ Your local environment should now be ready!


## Development Workflow

Most scripts/commands, such as running tests or database migrations, should be executed inside the Docker container to ensure a consistent environment.

### Running Commands in the Container

There are two ways to run commands inside the container:

1.  **Directly with `exec`**: `docker-compose --env-file .env.local -f docker-compose.dev.yml exec webapp-dev <your-command>`
2.  **Using an interactive shell**: Run `docker-compose --env-file .env.local -f docker-compose.dev.yml exec webapp-dev sh` to get a shell inside the container. You can then run your commands (e.g., `npm run test`). Type `exit` to return to your host machine.

### Database Changes
We use [Drizzle](https://orm.drizzle.team/docs/overview) to manage the database schema. All changes to the database should be made via the schema files in `/models`.

The development process is as follows. The below shell commands must be run inside the Docker container using one of the methods described above.

1. Make changes to schema files in `/models`.
2. Run `drizzle:push` to apply changes to your local database without creating migration files.
   ```bash
   npm run drizzle:push
   ```
3. When your feature is complete, generate the migration file:
   ```bash
   npm run drizzle:generate
   ```
4. Inspect the generated migration SQL, then apply it to your local instance:
   ```bash
   npm run drizzle:migrate
   ```

**IMPORTANT!!** [Read here on how to resolve migration file conflicts.](https://entrypointsrm.atlassian.net/wiki/spaces/Tech/pages/64454661/Resolving+merge+conflicts)

## Testing a Production Build Locally

We maintain a separate `docker-compose.yml` and `Dockerfile` to build a production-ready image of the application. This is useful for final testing before deployment and serves as the blueprint for our CI/CD process.

To build and run a production-like container, use the following command:

```bash
docker-compose --env-file .env.local up --build
```

This will create a lean, optimized container and run it on [http://localhost:3000](http://localhost:3000). Note that this setup does **not** have hot-reloading, so if you make any code changes you will need to re-build the Docker image.

## Pull requests
Before opening a pull request, check:
1. Does the production build execute successfully? (`docker-compose up --build`)
2. Have migrations been generated and have you tested them against a reset copy of your local database?

## Database Backup and Restore

**Note**: These commands require PostgreSQL client tools (`pg_dump`, `pg_restore`) to be installed on your host machine.

### Backup the Database

To create a backup of your current database state, run:

```bash
npm run db:backup
```

- This command executes the script at `supabase/backup-data.ts`.
- The backup file will be saved in the `supabase/backups/` directory.

### Restore the Database

To restore your database from a backup, run:

```bash
npm run db:restore
```

- This command executes the script at `supabase/restore-data.ts`.
- **Warning**: This will overwrite existing data in your database.