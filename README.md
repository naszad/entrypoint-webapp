# Project Setup Instructions

Follow these steps carefully to clone and run the project locally.

## Initial setup (run these steps only once)
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
npm supabase:start
```

This will start Supabase locally and provide you with the values needed for the next step.

### 5. Set Up Environment Variables

Create a `.env.local` file in the project root and add the following variables with the values provided by the `supabase start` command:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<api-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=<service_role key>
DATABASE_URL=<DB-url>
```

Make sure these values are correctly fetched from your running Supabase instance or your Supabase project.

### 6. Generate and run Drizzle migration

Generate the migration scripts from schema definition in `/models` folder:

```bash
npm run drizzle
```

This will generate migration scripts in `/migrations` folder and push migrations to supabase

### 7. Seed Supabase with an Auth User

Seed your local Supabase instance with an authentication user:

```bash
npm run seed
```

## Running the project
### Apply any migrations

```bash
npm run drizzle
```

### Run the Project

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

# ✅ Your local environment should now be ready!

If you encounter any issues:
- Ensure Docker Desktop is installed and running.
- Confirm all environment variables are set correctly.
- Verify Supabase services are up and operational.
