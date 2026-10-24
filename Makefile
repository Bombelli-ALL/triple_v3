.PHONY: help install install-backend install-frontend \
	build build-backend build-frontend \
	lint lint-backend lint-frontend \
	test test-backend \
	prisma-generate \
	dev dev-backend dev-frontend db-setup db-seed deploy

help:
	@echo "Available targets:"
	@echo "  install          Install backend and frontend dependencies"
	@echo "  build            Build backend and frontend"
	@echo "  lint             Run backend and frontend linters"
	@echo "  test             Run backend tests"
	@echo "  prisma-generate  Generate the Prisma client"
	@echo "  db-setup         Sync local DB schema from Prisma models (wipes data)"
	@echo "  db-seed          Seed the local database with demo data"
	@echo "  dev              Run backend (:3000) and frontend (:5173) together"
	@echo "  dev-backend      Run only the backend in watch mode"
	@echo "  dev-frontend     Run only the frontend dev server"
	@echo "  deploy           Build Docker images and ship them to the server (SSH=my-server)"

install: install-backend install-frontend

install-backend:
	npm --prefix backend install

install-frontend:
	npm --prefix frontend install

build: build-backend build-frontend

build-backend:
	npm --prefix backend run build

build-frontend:
	npm --prefix frontend run build

lint: lint-backend lint-frontend

lint-backend:
	npm --prefix backend run lint

lint-frontend:
	npm --prefix frontend run lint

test: test-backend

test-backend:
	npm --prefix backend test

prisma-generate:
	npm --prefix backend run generate

db-setup:
	cd backend && npx prisma db push --force-reset && npx prisma generate

db-seed:
	npm --prefix backend run seed

dev-backend:
	npm --prefix backend run start:dev

dev-frontend:
	npm --prefix frontend run dev

dev:
	@trap 'kill 0' INT TERM EXIT; \
	npm --prefix backend run start:dev & \
	npm --prefix frontend run dev & \
	wait

SSH ?= my-server
deploy:
	./deploy/deploy.sh $(SSH)
