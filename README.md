# Gigs.ma

TaskRabbit-style marketplace for services in Morocco. Find trusted providers for plumbing, electrical, cleaning, moving, and more — across all major Moroccan cities.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js 14 (App Router) + TypeScript + PWA |
| API | NestJS + TypeScript + Prisma |
| Database | PostgreSQL 16 |
| Cache/Queues | Redis 7 + BullMQ |
| Search | Meilisearch |
| File Storage | MinIO (local) / S3 (prod) |
| Monorepo | pnpm workspaces |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Docker** + Docker Compose

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> gigs && cd gigs
cp .env.example .env
pnpm install

# 2. Start infrastructure
make up
# → Postgres :5432, Redis :6379, Meilisearch :7700, MinIO :9000/:9001

# 3. Run migrations + seed
make migrate
make seed

# 4. Sync Meilisearch index
make search-sync

# 5. Start dev servers
make dev
# → API: http://localhost:4000
# → Web: http://localhost:3000
```

Or use the all-in-one setup:

```bash
cp .env.example .env
make setup   # up + install + migrate + seed + search-sync
make dev
```

## Project Structure

```
gigs/
├── apps/
│   ├── api/                 # NestJS API (port 4000)
│   │   ├── prisma/          # Schema + migrations + seed
│   │   └── src/
│   │       ├── auth/        # JWT auth + OTP placeholder
│   │       ├── bookings/    # Booking CRUD + status transitions
│   │       ├── bullmq/      # Background job processors
│   │       ├── categories/  # Category listing
│   │       ├── cities/      # City listing
│   │       ├── common/      # Decorators, guards, pipes, filters
│   │       ├── gigs/        # Gig CRUD + filtering + pagination
│   │       ├── meilisearch/ # Search service
│   │       ├── prisma/      # Prisma module
│   │       ├── reviews/     # Review CRUD
│   │       └── scripts/     # CLI scripts (Meilisearch sync)
│   └── web/                 # Next.js PWA (port 3000)
│       ├── public/          # manifest.json, sw.js, icons
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # Shared components
│           └── lib/         # API client
├── packages/
│   └── shared/              # Shared types, Zod schemas, constants
├── docker-compose.yml       # Dev infrastructure
├── Makefile                 # Dev commands
└── pnpm-workspace.yaml
```

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://gigs:gigs_secret@localhost:5433/gigs_db` | PostgreSQL connection |
| `REDIS_URL` | `redis://localhost:6380` | Redis connection |
| `MEILISEARCH_URL` | `http://localhost:7701` | Meilisearch host |
| `MEILISEARCH_API_KEY` | `gigs_master_key` | Meilisearch master key |
| `JWT_SECRET` | (dev default) | **Change in production** |
| `API_PORT` | `4000` | NestJS port |
| `WEB_PORT` | `3000` | Next.js port |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | - | Register new user |
| POST | `/api/auth/login` | - | Login with email/password |
| POST | `/api/auth/otp/request` | - | Request OTP (stub) |
| POST | `/api/auth/otp/verify` | - | Verify OTP (dev: code=123456) |
| GET | `/api/categories` | - | List categories |
| GET | `/api/cities` | - | List cities |
| GET | `/api/gigs` | - | List gigs (filters: categoryId, cityId, minPrice, maxPrice, q) |
| GET | `/api/gigs/:slug` | - | Gig details |
| POST | `/api/gigs` | Provider | Create gig |
| PATCH | `/api/gigs/:id` | Provider | Update gig |
| GET | `/api/bookings` | Auth | List user's bookings |
| POST | `/api/bookings` | Auth | Create booking |
| PATCH | `/api/bookings/:id/status` | Auth | Update booking status |
| GET | `/api/reviews/provider/:id` | - | List provider's reviews |
| POST | `/api/reviews` | Auth | Create review |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Provider | provider@gigs.ma | password123 |
| Client | client@gigs.ma | password123 |

## Docker Commands (Makefile)

```bash
make up          # Start all Docker services
make down        # Stop all Docker services
make logs        # Follow Docker logs
make shell       # Open psql shell
make migrate     # Run Prisma migrations
make seed        # Seed database
make search-sync # Sync Meilisearch from DB
make studio      # Open Prisma Studio
make dev         # Start API + Web dev servers
make build       # Build all packages
```

## Ports

| Service | Port |
|---------|------|
| Next.js (web) | 3000 |
| NestJS (API) | 4000 |
| PostgreSQL | 5433 |
| Redis | 6380 |
| Meilisearch | 7701 |
| MinIO API | 9002 |
| MinIO Console | 9003 |

## Production Scaling Notes

### Horizontal Scaling
- **API servers**: Stateless — deploy N instances behind a load balancer (nginx/ALB)
- **Web servers**: Next.js can run in standalone mode with multiple replicas
- **Job workers**: BullMQ workers can run on separate nodes, Redis handles coordination

### Database
- Add read replicas for query-heavy endpoints (gig listing, search)
- Connection pooling via PgBouncer
- Key indexes already defined in Prisma schema (on foreign keys, status, price, dates)
- Consider partitioning bookings table by date when it grows past ~10M rows

### Caching Strategy
- Redis for session storage + API response caching
- Cache categories and cities (change rarely)
- Cache gig listings with short TTL (30s–60s)
- Invalidate on write via BullMQ job

### Search
- Meilisearch handles full-text search with typo tolerance
- Upgrade path to OpenSearch/Elasticsearch if >1M documents
- All gig mutations trigger async reindexing via BullMQ

### Rate Limiting
- Configured globally: 10 req/s burst, 100 req/min sustained
- Per-endpoint overrides available via @Throttle() decorator

### CDN/WAF
- Cloudflare in front for DDoS protection + static asset caching
- Next.js static pages via ISR for SEO pages

### File Storage
- MinIO locally, S3 in production
- Signed upload URLs for direct client-to-S3 uploads (bypass API)

## PWA Features
- Web App Manifest with Moroccan-themed branding
- Service Worker with offline shell (network-first for navigation, cache-first for assets)
- Installable on mobile home screen
