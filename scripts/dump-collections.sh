#!/bin/bash

# Dump MongoDB collection contents for inspection
# Usage: ./scripts/dump-collections.sh [collection_name]
#
# Examples:
#   ./scripts/dump-collections.sh                    # Show all collections
#   ./scripts/dump-collections.sh sourceenergyreadings
#   ./scripts/dump-collections.sh displayenergydata
#   ./scripts/dump-collections.sh energies

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
DB_NAME="energy_consumption"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to dump a collection
dump_collection() {
  local collection=$1
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Collection: ${GREEN}${collection}${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

  # Count documents
  local count=$(mongosh "$MONGODB_URI/$DB_NAME" --quiet --eval "db.${collection}.countDocuments()")
  echo -e "${YELLOW}Total documents:${NC} ${count}"

  if [ "$count" -eq 0 ]; then
    echo -e "${RED}⚠️  Collection is empty${NC}"
  else
    echo -e "\n${YELLOW}Sample documents (max 5):${NC}"
    mongosh "$MONGODB_URI/$DB_NAME" --quiet --eval "db.${collection}.find().limit(5).forEach(printjson)"
  fi
  echo ""
}

# Function to show collection sizes
show_summary() {
  echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  ${YELLOW}MongoDB Collection Summary${NC}                            ${BLUE}║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""

  local collections=("sourceenergyreadings" "displayenergydata" "energies" "featureflags" "users" "contracts")

  printf "%-30s %s\n" "Collection" "Count"
  echo "───────────────────────────────────────────────────"

  for coll in "${collections[@]}"; do
    local count=$(mongosh "$MONGODB_URI/$DB_NAME" --quiet --eval "db.${coll}.countDocuments()" 2>/dev/null || echo "0")

    if [ "$count" -gt 0 ]; then
      printf "%-30s ${GREEN}%s${NC}\n" "$coll" "$count"
    else
      printf "%-30s ${RED}%s${NC}\n" "$coll" "$count"
    fi
  done
  echo ""
}

# Function to show feature flags status
show_flags() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}Feature Flags Status${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

  mongosh "$MONGODB_URI/$DB_NAME" --quiet --eval '
    db.featureflags.find({
      name: {
        $in: [
          "NEW_BACKEND_ENABLED",
          "DASHBOARD_NEW_BACKEND",
          "CHARTS_NEW_BACKEND",
          "TIMELINE_NEW_BACKEND",
          "CSV_IMPORT_NEW_BACKEND",
          "FORM_NEW_BACKEND"
        ]
      }
    }).forEach(function(flag) {
      var status = flag.enabled ? "✅ ON " : "❌ OFF";
      print(flag.name.padEnd(33, " ") + status + "    " + (flag.rolloutPercent || 0) + "%");
    });
  '
  echo ""
}

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
  echo -e "${RED}Error: mongosh is not installed${NC}"
  echo "Install it from: https://www.mongodb.com/try/download/shell"
  exit 1
fi

# Check if MongoDB is running
if ! mongosh "$MONGODB_URI/$DB_NAME" --quiet --eval "db.version()" &> /dev/null; then
  echo -e "${RED}Error: Cannot connect to MongoDB at $MONGODB_URI${NC}"
  echo "Make sure your dev server is running: npm run dev"
  exit 1
fi

# Main logic
if [ $# -eq 0 ]; then
  # No arguments - show summary, flags, and all collections
  show_summary
  show_flags

  echo -e "${YELLOW}Would you like to see detailed collection contents?${NC}"
  echo "Run: $0 <collection_name>"
  echo ""
  echo "Available collections:"
  echo "  - sourceenergyreadings (NEW backend source data)"
  echo "  - displayenergydata (NEW backend cache)"
  echo "  - energies (OLD backend data)"
  echo "  - featureflags"
  echo "  - users"
  echo "  - contracts"

elif [ "$1" == "--all" ]; then
  # Dump all main collections
  dump_collection "sourceenergyreadings"
  dump_collection "displayenergydata"
  dump_collection "energies"
  dump_collection "featureflags"

elif [ "$1" == "--flags" ]; then
  # Show just feature flags
  show_flags

else
  # Dump specific collection
  dump_collection "$1"
fi

echo -e "${GREEN}✓ Done${NC}"
