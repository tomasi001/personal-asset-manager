#!/bin/bash

# Check if a migration name is provided
if [ -z "$1" ]; then
  echo "Usage: ./create_migration.sh <migration_name>"
  exit 1
fi

# Create a new migration file with a timestamp prefix
touch src/database/migrations/$(date +"%Y%m%dT%H%M%S")_"$1".ts
echo "Migration file created: $(date +"%Y%m%dT%H%M%S")_$1.ts"

# Usage
# touch src/database/migrations/$(date +"%Y%m%dT%H%M%S")_<migration_name>.ts