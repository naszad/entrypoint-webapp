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

Follow these steps carefully to clone and run the project locally.
### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone <your-repository-url>
cd <project-folder>
```

### 2. Install Dependencies

Install all necessary project dependencies:

```bash
npm install
```

### 3. Install Docker Desktop

Make sure you have Docker Desktop installed and running on your machine.  
Download it here: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)


### 4. Initialize and Start Supabase

Run the local Supabase environment:

```bash
npm run supabase:start
```

This will start Supabase locally and provide you with the values needed for the next step.

### 5. Set Up Environment Variables

Create a `.env.local` file in the project root and add the following variables with the values provided by the `supabase:start` command:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<api-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=<service_role key>
DATABASE_URL=<DB-url>
```

Make sure these values are correctly fetched from your running Supabase instance or your Supabase project.

### 6. Get a local database
Execute a reset, which will apply migrations and seed data located in `supabase/seed/`.

```bash
npm run reset
```

You can safely run this command anytime you want to wipe and reset your local database. 

The initial seeded user is `test@email.com` with a password of `password`.


## Running the project
### Apply any pending migrations
If you pulled down any unapplied migrations, make sure they are executed. This happens as part of `npm run reset`, but if you want to apply migrations as they would be in production (without erasing the whole database), you can run:

```bash
npm run drizzle:migrate
```

### Run the Project

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### ✅ Your local environment should now be ready!

If you encounter any issues:
- Ensure Docker Desktop is installed and running.
- Confirm all environment variables are set correctly.
- Verify Supabase services are up and operational.


## Developing
See https://entrypointsrm.atlassian.net/wiki/spaces/Tech/pages/14024707/Coding+Practices and subpages for guidelines.

### Database changes
We use [Drizzle](https://orm.drizzle.team/docs/overview) to manage the application's database schema and derive Typescript types. You should only make any changes to the database via the Drizzle schema files located in `/models`.

During development, it's best practice to use [Drizzle kit's push functionality](https://orm.drizzle.team/docs/drizzle-kit-push) to push these changes to your local database for testing without generating migration files for every little change. Only generate a migration file once you are satisfied with the finalized schema for your feature.

An outline of the process is:

1. Make changes to schema files in `/models` as appropriate for your feature
2. Run `npm run drizzle:push` to directly push the changes onto your local database without generating migration files. (Reset the database as needed with `npm run reset`)
3. Develop your feature, repeating steps 1 and 2 as needed.
4. When ready, generate migrations `npm run drizzle:generate`
5. Inspect the generated migration files for accuracy, then apply it to your local instance with `npm run drizzle:migrate`
6. Push your code, and open a PR

**IMPORTANT!!** [Read here on how to resolve migration file conflicts.](https://entrypointsrm.atlassian.net/wiki/spaces/Tech/pages/64454661/Resolving+merge+conflicts)

### Pull requests
Before opening a pull request, check:
1. Does `npm run build` execute successfully?
2. Have migrations been generated and have you tested them against a reset copy of your local database?

## Database Backup and Restore

### Prerequisites

These commands require the following utilities to be installed and available in your system's PATH:

- [`pg_dump`](https://www.postgresql.org/docs/current/app-pgdump.html)
- [`pg_restore`](https://www.postgresql.org/docs/current/app-pgrestore.html)

These are standard command-line tools provided by PostgreSQL. You can install them by installing [PostgreSQL](https://www.postgresql.org/download/) on your system.

### Backup the Database

To create a backup of your current database state, run:

```bash
npm run db:backup
```

- This command executes the script at `supabase/backup-data.ts`.
- The backup file will be saved in the `supabase/backups/` directory (e.g., `supabase/backups/backup.dump`).
- Use this before making major changes or for regular backups.

### Restore the Database

To restore your database from a backup, run:

```bash
npm run db:restore
```

- This command executes the script at `supabase/restore-data.ts`.
- It restores your database from the backup file located in the `supabase/backups/` directory (e.g., `supabase/backups/backup.dump`).
- Use this if you need to revert your database to a previous state.

**Note:**
- Restoring a backup will overwrite existing data in your database.
- Ensure you have the correct permissions and have reviewed the backup file before restoring.