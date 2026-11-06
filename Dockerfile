# JBM website: React (Vite) front end + PHP backend, served by Apache.
# Used by Render (see render.yaml). The database lives in TiDB Cloud, not in this container.

# ---- 1. build the React site ----
FROM node:20-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. PHP + Apache ----
FROM php:8.2-apache
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && docker-php-ext-install pdo_mysql \
 && a2enmod rewrite \
 && echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf \
 && a2enconf servername

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
# .gitattributes already keeps these files LF; the tr below is a safety net for Windows line endings
RUN tr -d '\015' < /usr/local/bin/entrypoint.sh > /tmp/entrypoint.sh \
 && mv /tmp/entrypoint.sh /usr/local/bin/entrypoint.sh \
 && chmod +x /usr/local/bin/entrypoint.sh

# backend lives outside the web root; only /api is exposed (see apache.conf)
COPY backend /var/www/backend
# built website
COPY --from=build /app/frontend/dist /var/www/html
# image folder the admin uploads into (same relative path the PHP code uses)
COPY frontend/public/images /var/www/frontend/public/images
RUN chown -R www-data:www-data /var/www/frontend

ENV PORT=10000
EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
