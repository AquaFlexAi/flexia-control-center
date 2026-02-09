#!/bin/bash

# FlexAi Database Manager
# Usage: ./db_manager.sh [command] [args]

# Configuration
DB_CONTAINER="flexia-supabase-db"
DB_USER="postgres"
DB_NAME="postgres"
MIGRATIONS_DIR="./migrations"
BACKUP_DIR="./backups"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper: Execute SQL command
exec_sql() {
    docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "$1"
}

# Helper: Execute SQL file
exec_file() {
    # Use cat to pipe file content to docker exec to avoid path mapping issues
    cat "$1" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
}

# Command: migration:init
cmd_migration_init() {
    echo "Initializing migration tracking..."
    exec_sql "CREATE TABLE IF NOT EXISTS public.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());"
}

# Command: migration:new <name>
cmd_migration_new() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Migration name required${NC}"
        echo "Usage: ./db_manager.sh migration:new <name>"
        exit 1
    fi
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    FILENAME="${TIMESTAMP}_$1.sql"
    mkdir -p $MIGRATIONS_DIR
    touch "$MIGRATIONS_DIR/$FILENAME"
    echo -e "${GREEN}Created migration: $MIGRATIONS_DIR/$FILENAME${NC}"
}

# Command: migration:apply
cmd_migration_apply() {
    cmd_migration_init
    mkdir -p $MIGRATIONS_DIR
    
    echo "Checking for pending migrations..."
    APPLIED_COUNT=0
    
    # Loop through sql files in order
    for file in $MIGRATIONS_DIR/*.sql; do
        # Check if file exists (if glob matches nothing, loop runs once with string literal)
        [ -e "$file" ] || continue
        
        BASENAME=$(basename "$file")
        VERSION="${BASENAME%%_*}"
        
        # Check if version exists in DB
        EXISTS=$(docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM public.schema_migrations WHERE version = '$VERSION'")
        
        if [ "$EXISTS" != "1" ]; then
            echo "Applying $BASENAME..."
            if exec_file "$file"; then
                exec_sql "INSERT INTO public.schema_migrations (version) VALUES ('$VERSION');"
                echo -e "${GREEN}Applied $BASENAME${NC}"
                ((APPLIED_COUNT++))
            else
                echo -e "${RED}Failed to apply $BASENAME${NC}"
                exit 1
            fi
        else
            echo "Skipping $BASENAME (already applied)"
        fi
    done
    
    if [ $APPLIED_COUNT -eq 0 ]; then
        echo -e "${GREEN}No new migrations to apply.${NC}"
    else
        echo -e "${GREEN}Successfully applied $APPLIED_COUNT migrations.${NC}"
    fi
}

# Command: backup:create
cmd_backup_create() {
    mkdir -p $BACKUP_DIR
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    FILENAME="$BACKUP_DIR/backup_$TIMESTAMP.sql"
    echo "Creating backup to $FILENAME..."
    docker exec $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME --clean --if-exists > "$FILENAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Backup created successfully at $FILENAME${NC}"
    else
        echo -e "${RED}Backup failed${NC}"
        rm -f "$FILENAME"
        exit 1
    fi
}

# Command: backup:restore <file>
cmd_backup_restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Backup file path required${NC}"
        echo "Usage: ./db_manager.sh backup:restore <path/to/backup.sql>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        echo -e "${RED}Error: File $1 not found${NC}"
        exit 1
    fi
    
    echo "Restoring from $1..."
    echo "Warning: This will overwrite current database state."
    
    # Optional: Confirm? (Skip for automation)
    
    cat "$1" | docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Restore complete.${NC}"
    else
        echo -e "${RED}Restore failed${NC}"
        exit 1
    fi
}

# Command: dev:reset
cmd_dev_reset() {
    echo "Resetting database environment..."
    docker-compose down -v
    docker-compose up -d
    
    echo "Waiting for database to be ready..."
    # Simple retry loop
    for i in {1..30}; do
        if docker exec $DB_CONTAINER pg_isready -U $DB_USER > /dev/null 2>&1; then
            echo -e "${GREEN}Database is ready.${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    
    echo -e "${GREEN}Database reset complete. Init scripts should have run automatically.${NC}"
}

# Main Dispatcher
case "$1" in
    migration:new)
        cmd_migration_new "$2"
        ;;
    migration:apply)
        cmd_migration_apply
        ;;
    backup:create)
        cmd_backup_create
        ;;
    backup:restore)
        cmd_backup_restore "$2"
        ;;
    dev:reset)
        cmd_dev_reset
        ;;
    help|*)
        echo "FlexAi Database Manager"
        echo "Usage: $0 {command}"
        echo ""
        echo "Commands:"
        echo "  migration:new <name>   Create a new migration file"
        echo "  migration:apply        Apply pending migrations"
        echo "  backup:create          Create a full database backup"
        echo "  backup:restore <file>  Restore database from backup file"
        echo "  dev:reset              Full reset (down -v && up -d)"
        exit 1
        ;;
esac
