.PHONY: up down logs shell migrate seed dev build install search-sync studio

# Docker services
up:
	docker compose up -d
	@echo "Services started. Postgres:5433 Redis:6380 Meilisearch:7701 MinIO:9002/9003"

down:
	docker compose down

logs:
	docker compose logs -f

shell:
	docker compose exec postgres psql -U gigs -d gigs_db

# Dependencies
install:
	pnpm install

# Database
migrate:
	pnpm db:migrate

seed:
	pnpm db:seed

studio:
	pnpm db:studio

# Search
search-sync:
	pnpm search:sync

# Development
dev:
	pnpm dev

build:
	pnpm build

# Full setup (first time)
setup: up install migrate seed search-sync
	@echo "Setup complete! Run 'make dev' to start development servers."
