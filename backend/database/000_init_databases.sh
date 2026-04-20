#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE DATABASE "$BLOG_DB_NAME";
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$BLOG_DB_NAME" -f /docker-entrypoint-initdb.d/002_blogs_frontend.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$BLOG_DB_NAME" -f /docker-entrypoint-initdb.d/mock_blogs.sql
