# enlace

Open-source wedding website: fork it, edit a single config file, and get your own site with an RSVP form and admin panel.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Drizzle ORM** + **PostgreSQL** (Supabase)
- **Auth.js v5** (magic link)
- **Zod** (validation)
- Deploy: **Vercel**

## Internationalization

- Public site: Portuguese (pt-BR) by default.
- Admin panel: Portuguese and English.

## Getting started (local)

1. **Fork** this repository.
2. **Clone** and install:
   ```bash
   git clone https://github.com/YOUR_USERNAME/enlace.git
   cd enlace
   npm install
   ```
3. **Edit the site content** in `src/config/wedding.config.ts` (names, date, venue, etc.).
4. **Create a Supabase project** at [supabase.com](https://supabase.com) and copy the connection string.
5. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # edit .env.local with your values
   ```
6. **Push the schema to the database**:
   ```bash
   npm run db:push
   ```
7. **Start the dev server**:
   ```bash
   npm run dev
   ```

## Getting started (Docker)

The project ships a Docker stack with three services:

- **database** — PostgreSQL 16 (replaces Supabase locally).
- **app** — runs the Next.js dev server.
- **claude** — sandboxed container with the Claude Code CLI installed, for running it in permissive mode without exposing the host. Opt-in via the `jail` profile.

```bash
# Build images and start app + database
docker compose up --build

# In another terminal, push the schema to the local database
docker compose exec app npm run db:push

# Open the app
open http://localhost:3000

# Drop into the Claude jail container (separate command)
docker compose --profile jail run --rm claude
# Inside the container:
#   claude            # first run authenticates and stores creds in /home/node (persisted volume)
#   claude --dangerously-skip-permissions
```

When using Docker locally, `DATABASE_URL` is set automatically inside the containers (`postgres://enlace:enlace@database:5432/enlace`). Any other variables come from `.env.local` if present.

## Deploying to Vercel

1. Import the repository at [vercel.com](https://vercel.com).
2. Add the environment variables from `.env.local` in the Vercel dashboard.
3. Deploy.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:generate` — generate migration files from the schema
- `npm run db:migrate` — apply migrations
- `npm run db:push` — sync schema directly to the database (dev)
- `npm run db:studio` — open Drizzle Studio

## License

MIT
