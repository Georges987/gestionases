# =============================================================================
# Gestion ONG — image Docker
# Multi-stage : Node (build React) -> PHP Apache (runtime)
# Le conteneur sert :
#   http://<host>:3030/admin/       -> SPA React
#   http://<host>:3030/admin/api/   -> API PHP (PDO SQLite)
# Données (SQLite) persistées dans le volume /var/www/data
# =============================================================================

# ---------- Stage 1 : build frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /app

# Installation des deps (cache Docker si package-lock.json inchangé)
COPY package.json package-lock.json ./
RUN npm ci

# Copie des sources et build (VITE_API_BASE configurable via build arg)
COPY . .
ARG VITE_API_BASE=/admin/api
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# ---------- Stage 2 : runtime PHP Apache ----------
FROM php:8.2-apache AS runtime

# Extensions PHP requises : PDO PostgreSQL + PDO SQLite (option), Zip (backup), libpq (pg_dump)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev libpq-dev postgresql-client unzip \
    && docker-php-ext-install pdo pdo_pgsql pdo_sqlite zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Modules Apache nécessaires pour .htaccess / SPA / compression / cache
RUN a2enmod rewrite headers deflate expires

WORKDIR /var/www/html

# Frontend compilé -> /var/www/html/admin/
COPY --from=frontend /app/dist /var/www/html/admin

# API PHP -> /var/www/html/admin/api/
COPY api /var/www/html/admin/api

# .htaccess racine (redirect / -> /admin/, SPA, blocage .db, headers) — SANS HSTS (http local)
COPY docker/root.htaccess /var/www/html/.htaccess

# Dossier données persistant (SQLite) — hors webroot par sécurité maximale
RUN mkdir -p /var/www/data \
    && chown -R www-data:www-data /var/www/data \
    && chmod 755 /var/www/data \
    && chown -R www-data:www-data /var/www/html/admin

# Entrypoint : prépare les dossiers de données avant Apache
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Config par défaut — PostgreSQL externe (variables obligatoires fournies via .env / environment)
# DB_DRIVER=postgres (défaut). Pour revenir sur SQLite en local : DB_DRIVER=sqlite + DOSSIERS /var/www/data
ENV DB_DRIVER=postgres \
    ALLOWED_ORIGIN=http://localhost:3030 \
    JWT_EXPIRY=86400

EXPOSE 80

# Healthcheck léger : vérifie que Apache répond sur le port 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD php -r 'exit(@fsockopen("localhost", 80, $e, $t, 2) ? 0 : 1);'

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
