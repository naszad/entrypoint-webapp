# Project Setup Instructions

Follow these steps carefully to clone and run the project locally.

## 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone <your-repository-url>
cd <project-folder>
```

## 2. Install Dependencies

Install all necessary project dependencies:

```bash
npm install
```

## 3. Generate SQL Schema Scripts

Generate the SQL schema definition scripts into the `/models` folder:

```bash
npm run generate-schema
```

This will generate migration scripts in `/migrations` folder

## 4. Install Docker Desktop

Make sure you have Docker Desktop installed and running on your machine.  
Download it here: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

## 5. Initialize Supabase

Initialize the local Supabase environment:

```bash
npm run supabase:init
```

## 6. Start Supabase

Start the Supabase local development environment:

```bash
npm run supabase:start
```

## 7. Set Up Environment Variables

Create a `.env` file in the project root and add the following variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=<your-supabase-service-key>
```

Make sure these values are correctly fetched from your running Supabase instance or your Supabase project.

## 8. Move SQL Scripts to Migrations Folder

Move the generated SQL files into the Supabase migrations directory:

```bash
mv migrations/*.sql supabase/migrations/
```

## 9. Execute Database Migrations

Apply the SQL migrations to your local Supabase database:

```bash
npm run supabase:up
```

## 10. Seed Supabase with an Auth User

Seed your local Supabase instance with an authentication user:

```bash
npm run seed
```

## 11. Run the Project

Finally, start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

# ✅ Your local environment should now be ready!

If you encounter any issues:
- Ensure Docker Desktop is installed and running.
- Confirm all environment variables are set correctly.
- Verify Supabase services are up and operational.
