#!/bin/sh
# Container start-up for Render.
set -e

PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/__PORT__/${PORT}/" /etc/apache2/sites-available/000-default.conf

# Create/upgrade the database tables, then load the starting content (once). Both are safe to run on every start.
# If the database is not reachable yet, keep going so the site itself still comes up.
if [ -n "${DB_HOST}" ]; then
  for i in 1 2 3 4 5; do
    if php /var/www/backend/database/seed.php && php /var/www/backend/database/import_content.php; then
      break
    fi
    echo "Database setup attempt $i failed; retrying in 5s..."
    sleep 5
  done
else
  echo "DB_HOST is not set - skipping database setup."
fi

chown -R www-data:www-data /var/www/frontend/public/images 2>/dev/null || true
exec apache2-foreground
