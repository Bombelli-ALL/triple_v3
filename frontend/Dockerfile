# ---------- build ----------
FROM docker.io/library/node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Vite bakes these into the JS bundle at build time
ARG VITE_PUBLIC_API_URL=https://apitriple.nexdevo.com/api
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_PLACES_API_KEY
ARG VITE_GOOGLE_ROUTES_API_KEY
ARG VITE_GOOGLE_GEOCODING_API_KEY
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_PLACES_SEARCH_KEY
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GOOGLE_PLACES_API_KEY=$VITE_GOOGLE_PLACES_API_KEY \
    VITE_GOOGLE_ROUTES_API_KEY=$VITE_GOOGLE_ROUTES_API_KEY \
    VITE_GOOGLE_GEOCODING_API_KEY=$VITE_GOOGLE_GEOCODING_API_KEY \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_GOOGLE_PLACES_SEARCH_KEY=$VITE_GOOGLE_PLACES_SEARCH_KEY

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM docker.io/library/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
