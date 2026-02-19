#!/bin/bash

# Path to the .env file in the root directory
ENV_FILE="$(dirname "$0")/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ No .env file found in the root directory!"
  exit 1
fi

echo "🚀 Syncing .env to Convex..."

success_count=0
skip_count=0

# Read the .env file line by line
while IFS= read -r line || [ -n "$line" ]; do
  # Trim whitespace
  trimmed=$(echo "$line" | xargs)

  # Skip empty lines and comments
  if [[ -z "$trimmed" ]] || [[ "$trimmed" == \#* ]]; then
    continue
  fi

  # Extract key and value
  if [[ "$trimmed" == *"="* ]]; then
    key="${trimmed%%=*}"
    value="${trimmed#*=}"

    # Remove surrounding quotes if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

    # Skip Convex system vars and Vite public vars
    if [[ "$key" == "CONVEX_DEPLOYMENT" ]] || \
       [[ "$key" == "VITE_CONVEX_URL" ]] || \
       [[ "$key" == VITE_* ]] || \
       [[ "$key" == "SITE_URL" ]]; then
      echo "⏭️  Skipping local/public variable: $key"
      ((skip_count++))
      continue
    fi

    echo "⏳ Setting $key..."
    
    # Run the Convex CLI command to set the environment variable
    if npx convex env set "$key" "$value"; then
      ((success_count++))
    else
      echo "❌ Failed to set $key"
    fi
  fi
done < "$ENV_FILE"

echo -e "\n✅ Done! Synced $success_count variables (Skipped $skip_count)."
