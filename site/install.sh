#!/bin/sh
set -e

echo ""
echo "  GrabGPT Installer"
echo "  =================="
echo ""

if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node -v)
  echo "  Node.js found: $NODE_VERSION"
else
  echo "  Node.js not found. Installing..."
  if command -v apt-get >/dev/null 2>&1; then
    echo "  Using apt..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v brew >/dev/null 2>&1; then
    echo "  Using Homebrew..."
    brew install node
  elif command -v dnf >/dev/null 2>&1; then
    echo "  Using dnf..."
    sudo dnf install -y nodejs
  elif command -v pacman >/dev/null 2>&1; then
    echo "  Using pacman..."
    sudo pacman -S --noconfirm nodejs npm
  else
    echo "  ERROR: Could not detect package manager."
    echo "  Please install Node.js manually: https://nodejs.org"
    exit 1
  fi
  echo "  Node.js installed: $(node -v)"
fi

echo ""
echo "  Starting GrabGPT..."
echo ""

npx grabgpt@latest
