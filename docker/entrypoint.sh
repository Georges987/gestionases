#!/bin/sh
set -e

DRIVER="${DB_DRIVER:-postgres}"

if [ "$DRIVER" = "sqlite" ]; then
  DB_PATH="${DB_PATH:-/var/www/data/users.db}"
  GESTION_DB_PATH="${GESTION_DB_PATH:-/var/www/data/gestion.db}"
  mkdir -p "$(dirname "$DB_PATH")" "$(dirname "$GESTION_DB_PATH")"
  chown -R www-data:www-data "$(dirname "$DB_PATH")" "$(dirname "$GESTION_DB_PATH")" 2>/dev/null || true
  chmod -R 755 "$(dirname "$DB_PATH")" "$(dirname "$GESTION_DB_PATH")" 2>/dev/null || true
fi

echo "Gestion ONG — demarrage"
echo "  DB_DRIVER       = $DRIVER"
if [ "$DRIVER" = "postgres" ]; then
  echo "  DB_HOST         = ${DB_HOST:-?}"
  echo "  DB_PORT         = ${DB_PORT:-5432}"
  echo "  DB_NAME         = ${DB_NAME:-?}"
  echo "  DB_USER         = ${DB_USER:-?}"
  echo "  DB_SSLMODE      = ${DB_SSLMODE:-prefer}"
  echo "  ALLOWED_ORIGIN  = ${ALLOWED_ORIGIN:-http://localhost:3030}"
  echo "  ADMIN_EMAIL     = ${ADMIN_EMAIL:-admin@gestion-ong.org}"
else
  echo "  DB_PATH         = ${DB_PATH:-/var/www/data/users.db}"
  echo "  GESTION_DB_PATH = ${GESTION_DB_PATH:-/var/www/data/gestion.db}"
  echo "  ALLOWED_ORIGIN  = ${ALLOWED_ORIGIN:-http://localhost:3030}"
  echo "  ADMIN_EMAIL     = ${ADMIN_EMAIL:-admin@gestion-ong.org}"
fi

exec "$@"
