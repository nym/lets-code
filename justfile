_default:
    @just check test

# ------------------------------------------------------------------------------
# Development

# Prepare local development environment
[group('dev')]
setup:
    pnpm install
    @just db-migrate
    pnpm exec playwright install chromium
    @echo
    @echo "🚀 Happy hacking!"

# Run the node server
[group('dev')]
serve:
    node server.js

# Start development environment using Docker Compose
[group('dev')]
dev:
    docker compose -f docker/compose.yml up

# Format project source files
[group('dev')]
fmt:
    treefmt

# Lint project source files
[group('dev')]
lint:
    treefmt --ci --quiet

# ------------------------------------------------------------------------------
# Release

# Type check source files
[group('release')]
check:
    react-router typegen
    tsc -b

# Start the app in production mode
[group('release')]
start:
    NODE_ENV=production node server.js

# ------------------------------------------------------------------------------
# Test

# Run project test suite
[group('test')]
test:
    pnpm exec vitest run
    @just _check-e2e-port
    pnpm exec playwright test --reporter=list

# Check E2E port is available
[no-exit-message]
[private]
_check-e2e-port:
    #!/usr/bin/env zsh
    port="${E2E_PORT:-3001}"
    if pid=$(lsof -ti ":$port" -sTCP:LISTEN 2>/dev/null); then
        cmd=$(ps -p "$pid" -o comm= 2>/dev/null)
        echo >&2
        echo >&2 "{{ RED }}{{ BOLD }}Error:{{ NORMAL }}{{ BOLD }} Port $port required for e2e tests but in use by \`$cmd\` (PID $pid).{{ NORMAL }}"
        echo >&2
        exit 1
    fi

# ------------------------------------------------------------------------------
# Database

# Start an interactive psql session
[group('db')]
psql:
    psql "$DATABASE_URL"

# Generate migration files from Typescript definitions
[group('db')]
db-generate *args:
    drizzle-kit generate --config drizzle.config.ts {{ args }}

# Apply pending migrations
[group('db')]
db-migrate *args:
    drizzle-kit migrate --config drizzle.config.ts {{ args }}

# Remove project PostgreSQL state
[group('db')]
db-reset:
    #!/usr/bin/env zsh
    dir=".devenv/state/postgres"
    [[ ! -d "$dir" ]] && exit

    echo -n "{{ BOLD }}Are you sure you want to delete {{ YELLOW }}${dir}{{ NORMAL }}{{ BOLD }}? (y/N): {{ NORMAL }}"
    read response

    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -r .devenv/state/postgres/
        echo >&2 "🔥 PostgreSQL state deleted."
    fi

# ------------------------------------------------------------------------------
# Build

# Build the app
[group('build')]
build:
    react-router build

# Build a container image via Docker
[group('build')]
docker-build:
    docker build -f docker/Dockerfile.prod -t ai.iconicshift/app:latest .

# Run a container image via Docker
[group('build')]
docker-run *args:
    docker run -p 3000:3000 {{ args }} ai.iconicshift/app:latest

# ------------------------------------------------------------------------------
# Docker

# Run docker compose commands
[group('docker')]
docker *args:
    docker compose -f docker/compose.yml {{ args }}

# ------------------------------------------------------------------------------
# Storybook

# Start Storybook
[group('dev')]
storybook:
    pnpm exec storybook dev -p 6006 --no-open

# Build Storybook
[group('dev')]
storybook-build:
    pnpm exec storybook build
