# SCAPERAPP (minimal backend-first)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Add Supabase and optional Gemini keys.
4. Create `businesses` table using `supabase/schema.sql`.

## Run

```bash
npm run dev
```

Open:
- Run page: `http://localhost:3000/`
- Results page: `http://localhost:3000/results`

## API

- `GET /api/health`
- `POST /api/run`
- `GET /api/businesses`
