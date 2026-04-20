#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE "$BLOG_DB_NAME";
EOSQL

# These files are mounted outside docker-entrypoint-initdb.d so they do not
# auto-run against POSTGRES_DB during first-time container initialization.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$BLOG_DB_NAME" -f /blog-init/002_blogs_frontend.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$BLOG_DB_NAME" -f /blog-init/mock_blogs.sql
