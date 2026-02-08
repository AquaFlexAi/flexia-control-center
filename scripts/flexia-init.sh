#!/bin/bash

# FlexIA Overlay Engine - Initialization Script
# This script is injected into sub-project containers (OpenCode, Agent Zero)
# it pulls branding from the Control Center and applies it without modifying the core repo.

echo "🚀 FlexIA Overlay Engine starting..."

# 1. Fetch Branding Config from Supabase (via Control Center API)
# In a real environment, we'd use curl to a private endpoint.
# For now, we simulate the environment variables being passed via Docker.

APP_NAME=${FLEXIA_APP_NAME:-"FlexIA SubProject"}
PRIMARY_COLOR=${FLEXIA_PRIMARY_COLOR:-"#8b5cf6"}
RUN_MODE=${FLEXIA_RUN_MODE:-"prod"}

echo "Configuring for $APP_NAME ($RUN_MODE mode)..."

# 2. Apply Branding based on project type
if [ -f "package.json" ] && grep -q "opencode" "package.json"; then
    echo "Detected OpenCode Project..."
    # Inject Vite Env Vars for Branding
    echo "VITE_APP_NAME=\"$APP_NAME\"" > .env.production
    echo "VITE_PRIMARY_COLOR=\"$PRIMARY_COLOR\"" >> .env.production
    
    # Symlink branding assets if they exist
    if [ -f "/branding/logo.svg" ]; then
        ln -sf /branding/logo.svg packages/console/app/src/asset/logo-ornate-dark.svg
    fi
fi

if [ -f "agent.py" ]; then
    echo "Detected Agent Zero Project..."
    # Patch the system prompt to reflect identity
    if [ -f "prompts/default/agent.system.md" ]; then
        sed -i "s/Agent Zero/$APP_NAME/g" prompts/default/agent.system.md
    fi
fi

# 3. Start the application
if [ "$RUN_MODE" == "dev" ]; then
    echo "Entering DEVELOPMENT mode with hot-reload..."
    if [ -f "package.json" ]; then
        bun dev
    else
        python run_ui.py --dev
    fi
else
    echo "Entering PRODUCTION mode..."
    if [ -f "package.json" ]; then
        bun start
    else
        python run_ui.py
    fi
fi
