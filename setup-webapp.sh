#!/bin/bash

# Quiz Tournament - Web Application Setup Script
# This script sets up the Quiz Tournament web application in a new directory

# Set text colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display messages
show_message() {
  echo -e "${BLUE}[SETUP]${NC} $1"
}

show_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

show_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Ask for the target directory
read -p "Enter the target directory path (or press Enter for current directory): " TARGET_DIR
TARGET_DIR=${TARGET_DIR:-$(pwd)}

if [ ! -d "$TARGET_DIR" ]; then
  show_message "Directory $TARGET_DIR does not exist. Creating it..."
  mkdir -p "$TARGET_DIR"
  if [ $? -ne 0 ]; then
    show_error "Failed to create directory $TARGET_DIR. Exiting."
    exit 1
  fi
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy all files to the target directory
show_message "Copying web application files to $TARGET_DIR..."
cp -r "$SCRIPT_DIR"/* "$TARGET_DIR/"
if [ $? -ne 0 ]; then
  show_error "Failed to copy files to $TARGET_DIR. Exiting."
  exit 1
fi

# Check if we copied the setup script itself to the target directory
if [ -f "$TARGET_DIR/setup-webapp.sh" ]; then
  show_message "Removing setup script from target directory..."
  rm "$TARGET_DIR/setup-webapp.sh"
fi

cd "$TARGET_DIR"

# Install dependencies
show_message "Installing dependencies... This may take a few minutes."
npm install
if [ $? -ne 0 ]; then
  show_error "Failed to install dependencies. Please try again manually:"
  show_error "cd \"$TARGET_DIR\" && npm install"
  exit 1
fi

# Check if .env file exists, create if it doesn't
if [ ! -f ".env" ]; then
  show_message "Creating default .env file..."
  echo "# Database configuration
DATABASE_URL=postgres://username:password@host:port/database

# Firebase configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_APP_ID=your-firebase-app-id

# Session secret
SESSION_SECRET=your-session-secret-key

# Paytm Gateway configuration (optional)
PAYTM_MID=your-merchant-id
PAYTM_WEBSITE=WEBSTAGING
PAYTM_INDUSTRY_TYPE_ID=Retail
PAYTM_CHANNEL_ID=WEB
PAYTM_MERCHANT_KEY=your-merchant-key" > .env

  show_warning "Please update the .env file with your actual configuration values."
fi

show_success "Quiz Tournament web application has been set up successfully!"
show_message "To start the development server, run: npm run dev"
show_message "To build for production, run: npm run build"
show_message "For database setup, run: npm run db:push"
show_message "For more information, see README.md"