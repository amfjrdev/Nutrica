# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Serve with Caddy
FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy
# SPA fallback + no-cache on index.html so browser always gets fresh bundle
RUN printf ':80 {\n\
    root * /usr/share/caddy\n\
    encode gzip\n\
    @html {\n\
        path *.html\n\
        path /\n\
    }\n\
    header @html Cache-Control "no-cache, no-store, must-revalidate"\n\
    header @html Pragma "no-cache"\n\
    header @html Expires "0"\n\
    try_files {path} /index.html\n\
    file_server\n\
}\n' > /etc/caddy/Caddyfile
EXPOSE 80
