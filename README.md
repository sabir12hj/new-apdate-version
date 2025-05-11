# Quiz Tournament Web Application

A comprehensive Quiz Tournament platform leveraging interactive online quizzing with competitive and engaging user experiences.

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Google Auth + Local Auth
- **Payment Integration**: Paytm Gateway with UPI support
- **Styling**: Tailwind CSS with shadcn/ui components

## Project Structure

```
webapp-files/
├── client/                   # Frontend React application
│   ├── index.html           # HTML entry point
│   └── src/                 # React source code
│       ├── assets/          # Static assets (images, etc.)
│       ├── components/      # Reusable React components
│       ├── context/         # React context providers
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utility functions and libraries
│       ├── pages/           # Page components
│       ├── types/           # TypeScript type definitions
│       ├── App.tsx          # Main React component
│       ├── index.css        # Global CSS styles
│       └── main.tsx         # React entry point
├── server/                   # Backend Express server
│   ├── auth.ts              # Authentication logic
│   ├── db.ts                # Database connection
│   ├── google-auth.ts       # Google authentication setup
│   ├── index.ts             # Server entry point
│   ├── middlewares.ts       # Express middlewares
│   ├── paytm-upi.ts         # Payment integration
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Data storage interface
│   └── vite.ts              # Vite development server
├── shared/                   # Shared code between client and server
│   └── schema.ts            # Database schema and types
│
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── components.json          # shadcn/ui components configuration
├── vite.config.ts           # Vite configuration
└── drizzle.config.ts        # Drizzle ORM configuration
```

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create `.env` file with the following variables:
   ```
   DATABASE_URL=postgres://username:password@host:port/database
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   ```

3. Set up the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- **User Authentication**
  - Email/Password registration and login
  - Google authentication integration
  - JWT-based session management

- **Tournament Management**
  - Create and manage quiz tournaments
  - Set entry fees and prize pools
  - Schedule tournaments with start and end times

- **Quiz Interface**
  - Timed quiz experience
  - Multiple choice questions
  - Real-time score calculation
  - Anti-cheating mechanisms

- **Leaderboard and Rankings**
  - Real-time tournament leaderboards
  - Historical performance tracking
  - Winner showcase

- **Payment System**
  - Wallet balance management
  - Secure payment processing via Paytm
  - UPI integration for Indian users
  - Withdrawal functionality

- **User Profiles**
  - Profile management
  - Tournament history
  - Winning statistics
  - Bank and UPI details for withdrawals

## Deployment

For deployment instructions, refer to the following guides:
- [Frontend Deployment Guide](../deploy/frontend-deployment.md)
- [Backend Deployment Guide](../deploy/backend-deployment.md)

## Mobile App

For instructions on converting this web application to an Android app, refer to:
- [Android App Guide](../android-app-files/android-app-guide.md)
- [Android Build Guide](../android-app-files/android-build-guide.md)

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run db:push` - Update the database schema
- `npm run start` - Start the production server
- `npm run preview` - Preview the production build locally

## License

Copyright © 2025 Quiz Tournament. All rights reserved.