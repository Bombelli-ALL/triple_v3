#!/usr/bin/env bash
# Build both images on this PC, copy them to the server over SSH, and (re)start the stack.
# Usage: deploy/deploy.sh [ssh-host]      (default host: my-server, from ~/.ssh/config)
set -euo pipefail

SSH_HOST="${1:-my-server}"
REMOTE_DIR="triple"   # relative to the remote user's home
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Prefer docker; fall back to rootless podman (its saved archives load fine into docker)
if docker info >/dev/null 2>&1; then
  ENGINE=docker
elif command -v podman >/dev/null 2>&1; then
  ENGINE=podman
else
  echo "Need docker (with permission to use it) or podman." >&2
  exit 1
fi

# Google keys for the frontend bundle come from frontend/.env; the API URL is fixed to production
build_args=()
while IFS='=' read -r key value; do
  [[ "$key" =~ ^VITE_GOOGLE_[A-Z_]+$ ]] || continue
  value="${value%\"}"; value="${value#\"}"
  build_args+=(--build-arg "$key=$value")
done < <(grep -E '^VITE_GOOGLE_[A-Z_]+=' "$ROOT/frontend/.env" || true)

echo "==> Building images with $ENGINE"
$ENGINE build -t triple-backend:latest "$ROOT/backend"
$ENGINE build -t triple-frontend:latest \
  --build-arg VITE_PUBLIC_API_URL=https://apitriple.nexdevo.com/api \
  "${build_args[@]}" "$ROOT/frontend"

echo "==> Copying images to $SSH_HOST (this can take a few minutes)"
save_flags=()
[ "$ENGINE" = podman ] && save_flags=(-m)   # without -m podman saves only the first image under both names
$ENGINE save "${save_flags[@]}" triple-backend:latest triple-frontend:latest | gzip | ssh "$SSH_HOST" 'gunzip | docker load'
# podman names images localhost/<name>; give them the plain names docker-compose.yml expects
ssh "$SSH_HOST" 'for i in triple-backend triple-frontend; do
  docker image inspect "localhost/$i:latest" >/dev/null 2>&1 && docker tag "localhost/$i:latest" "$i:latest" || true
done'

echo "==> Copying compose files"
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
scp "$ROOT/deploy/docker-compose.yml" \
    "$ROOT/deploy/.env.example" "$ROOT/deploy/backend.env.example" "$SSH_HOST:$REMOTE_DIR/"

if ! ssh "$SSH_HOST" "test -f $REMOTE_DIR/.env && test -f $REMOTE_DIR/backend.env"; then
  echo
  echo "First deploy: create the secrets on the server, then run this script again:"
  echo "  ssh $SSH_HOST"
  echo "  cd ~/$REMOTE_DIR && cp .env.example .env && cp backend.env.example backend.env"
  echo "  nano .env && nano backend.env"
  exit 0
fi

echo "==> Starting the stack"
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose up -d --remove-orphans && docker image prune -f >/dev/null && docker compose ps"
echo "Done: https://triple.nexdevo.com  |  https://apitriple.nexdevo.com/api"
