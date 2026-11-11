#!/bin/bash
set -e

# This script runs ONLY on first initialization of an empty PostgreSQL data volume.
# It creates the application role and database for StockFlow.
# Credentials are read from environment variables set in compose.yaml.

echo "=== StockFlow: Creating application role and database ==="

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$STOCKFLOW_DB_USERNAME') THEN
            EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '$STOCKFLOW_DB_USERNAME', '$STOCKFLOW_DB_PASSWORD');
            RAISE NOTICE 'Role % created.', '$STOCKFLOW_DB_USERNAME';
        ELSE
            RAISE NOTICE 'Role % already exists, skipping.', '$STOCKFLOW_DB_USERNAME';
        END IF;
    END
    \$\$;

    -- Create stockflow database owned by the application role (if it doesn't exist)
    SELECT 'CREATE DATABASE stockflow OWNER ' || quote_ident('$STOCKFLOW_DB_USERNAME')
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'stockflow')\gexec

    -- Grant all privileges on the database to the application role
    GRANT ALL PRIVILEGES ON DATABASE stockflow TO "$STOCKFLOW_DB_USERNAME";
EOSQL

echo "=== StockFlow: Database initialization complete ==="
