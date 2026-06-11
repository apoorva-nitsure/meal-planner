# Meal Planner

An AI-powered weekly meal planning app with macro tracking, grocery list generation, and store price matching. Built with Next.js, Turso (LibSQL), and Claude AI.

## Features

- **Meal Library** — Create and manage meals with full macro/ingredient breakdowns; meals can belong to multiple categories (e.g., lunch + dinner)
- **AI Meal Planning** — Auto-generate weekly plans from your meal library based on calorie/macro targets (only picks from existing meals, never invents new ones)
- **AI Ingredient Prediction** — Type an ingredient name and AI auto-fills calories, protein, carbs, fat, and grocery category
- **AI Meal Assist** — Describe a meal in natural language and get a complete structured meal with all ingredients and macros
- **Macro Tracking** — Daily and weekly macro summaries with food source breakdowns
- **Grocery Lists** — Auto-generated from your weekly plan, grouped by category (Sunday–Saturday)
- **Price Matching** — AI-estimated prices for Trader Joe's and Whole Foods
- **PDF Import** — Import meal history from PDFs using RAG (chunking + FTS5 search)
- **Plan History** — View and delete past meal plans
- **Mobile Friendly** — Fully responsive with bottom nav, stacked layouts, and touch-friendly controls

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                 │
│                     Next.js App Router                            │
│                                                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────────┐   │
│  │  Meals    │ │   Plan    │ │  Macros   │ │   Grocery      │   │
│  │  CRUD     │ │  Sun-Sat  │ │  Charts   │ │   List +       │   │
│  │  + AI Fill│ │  +Dates   │ │  Summary  │ │   Prices       │   │
│  └───────────┘ └───────────┘ └───────────┘ └────────────────┘   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                      │
│  │ Settings  │ │ History   │ │   PDF     │                      │
│  │ Targets + │ │ View/Del  │ │  Import   │                      │
│  │ AI Rules  │ │           │ │           │                      │
│  └───────────┘ └───────────┘ └───────────┘                      │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                      API Routes
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                      Backend                                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    API Layer                               │   │
│  │                                                           │   │
│  │  /api/meals ──────────── CRUD meals + ingredients         │   │
│  │  /api/plans ──────────── Weekly plans + slots (CRUD+DEL)  │   │
│  │  /api/preferences ────── User macro targets + AI rules    │   │
│  │  /api/grocery ────────── Aggregate ingredients from plan  │   │
│  │  /api/prices ─────────── Store product price cache        │   │
│  │  /api/ai/suggest ─────── AI weekly plan generation        │   │
│  │  /api/ai/meal-assist ─── NL → structured meal            │   │
│  │  /api/ai/ingredient-predict ─ Per-ingredient macro AI     │   │
│  │  /api/ai/import-pdf ──── PDF → chunks + FTS index         │   │
│  │  /api/grocery/match ──── AI price estimation              │   │
│  └────────────────────┬────────────────────┬─────────────────┘   │
│                       │                    │                      │
│             ┌─────────▼──────┐    ┌────────▼──────────┐          │
│             │   Turso/LibSQL │    │   Claude AI API   │          │
│             │                │    │                    │          │
│             │  meals         │    │  Plan generation   │          │
│             │  ingredients   │    │  Meal assist       │          │
│             │  weekly_plans  │    │  Ingredient predict│          │
│             │  plan_slots    │    │  Grocery matching  │          │
│             │  store_products│    │  PDF processing    │          │
│             │  user_prefs    │    │                    │          │
│             │  pdf_imports   │    └────────────────────┘          │
│             │  meal_history  │                                    │
│             │   _chunks +FTS │                                    │
│             └────────────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 16 (App Router, Turbopack)  |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS 4 (mobile-first responsive) |
| Database   | Turso (LibSQL) + Drizzle ORM        |
| AI         | Claude API (Anthropic SDK)          |
| Charts     | Recharts                            |
| Data fetch | SWR                                 |
| Deploy     | Vercel                              |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Turso](https://turso.tech) database (free tier available)
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone the repository

```bash
git clone https://github.com/apoorva-nitsure/Meal_Planner.git
cd Meal_Planner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=libsql://your-db-name.turso.io
DATABASE_AUTH_TOKEN=your-turso-auth-token
```

**For local development with a file-based DB** (no Turso needed):

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./data/mealplanner.db
```

### 4. Push the database schema

```bash
npx drizzle-kit push
```

### 5. (Optional) Seed with sample data

```bash
npm run db:seed
```

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script            | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start dev server (Turbopack)         |
| `npm run build`   | Production build                     |
| `npm run start`   | Start production server              |
| `npm run lint`    | Run ESLint                           |
| `npm run db:generate` | Generate Drizzle migrations     |
| `npm run db:migrate`  | Run migrations                  |
| `npm run db:push`     | Push schema directly to DB      |
| `npm run db:seed`     | Seed database with sample meals |

## Deploying to Vercel

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` (your Turso URL)
   - `DATABASE_AUTH_TOKEN`
4. Deploy — Vercel auto-detects Next.js and deploys automatically on every push to main

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API
│   ├── api/
│   │   ├── ai/            # AI endpoints (suggest, meal-assist, ingredient-predict, pdf-import)
│   │   ├── grocery/       # Grocery list + price matching
│   │   ├── meals/         # Meal CRUD
│   │   ├── plans/         # Weekly plan management + delete
│   │   ├── preferences/   # User settings
│   │   └── prices/        # Store product prices
│   ├── grocery/           # Grocery list page
│   ├── history/           # Plan history (view + delete)
│   ├── macros/            # Macro tracking dashboard
│   ├── meals/             # Meal library pages
│   ├── plan/              # Weekly plan pages
│   └── settings/          # User preferences
├── components/
│   ├── ai/                # AI suggestion review UI
│   ├── layout/            # Sidebar, navigation
│   ├── macros/            # Charts, summaries
│   ├── meals/             # Meal forms, lists
│   └── plan/              # Week planner components
├── db/
│   ├── index.ts           # Database client + FTS setup
│   ├── schema.ts          # Drizzle schema definitions
│   └── seed.ts            # Sample data seeder
└── lib/
    ├── ai.ts              # AI plan generation logic
    ├── grocery.ts         # Ingredient aggregation
    ├── macros.ts          # Macro calculation helpers
    ├── pdf-extract.ts     # PDF text extraction
    ├── rag.ts             # RAG chunking + FTS indexing
    ├── scraper.ts         # Store price scraping
    └── week-utils.ts      # Week date utilities (Sunday-based weeks)
```

## How It Works

### Meal Planning Flow

1. Add meals to your library with ingredients and macros
2. Meals can have multiple categories (e.g., a meal tagged "lunch,dinner" appears in both slots)
3. Set your daily calorie/macro targets and custom AI rules in Settings
4. Click "AI Suggest" on the Plan page
5. AI picks meals **only from your library** to meet your targets (validates all IDs exist)
6. Review, adjust, and save the plan
7. Week runs **Sunday to Saturday** with dates displayed in the grid

### Adding Meals

1. Enter a meal name and click **"AI Fill"** to auto-generate all ingredients with macros
2. Or manually add ingredients — click the **✦ button** on any ingredient row to AI-predict its macros
3. Macros are auto-summed from all ingredients
4. Select one or more categories (breakfast, lunch, dinner, snack)

### Grocery List Flow

1. Ingredients are aggregated from all meals in the week's plan
2. Quantities are summed and normalized (e.g., multiple "1 cup rice" → "3 cups rice")
3. Click "Match Products" to get AI-estimated store prices
4. Check items off as you shop

### PDF Import (RAG)

1. Upload a PDF with meal history/nutrition data
2. Text is extracted, chunked, and classified (meal/nutrition/plan/general)
3. Chunks are indexed in FTS5 for fast keyword search
4. AI can reference this history when generating plans or assisting with meals

## Responsive Design

The app is fully mobile-friendly with adaptive layouts:

- **Mobile** — Bottom tab navigation, stacked day cards for the weekly plan, collapsible ingredient forms with labeled macro fields, bottom-sheet meal picker
- **Desktop** — Fixed sidebar navigation, 7-column week grid with hover tooltips, inline ingredient row editor

Key responsive patterns:
- Sidebar hidden on mobile, replaced with a fixed bottom nav bar
- Week planner switches from grid to vertical day cards on small screens
- Ingredient form stacks fields vertically on mobile with labeled inputs
- Meal picker slides up as a bottom sheet on mobile
- All page headers and controls stack vertically on narrow viewports
