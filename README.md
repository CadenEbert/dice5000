# Dice5000

Multiplayer Dice 5000 game built with Next.js, Firebase, GraphQL, and WebSocket subscriptions.

## Overview

Dice5000 is a dice game where players take turns rolling dice trying to rack up points. The scoring is ones are 100 points and fives are 50 points. Rolling 3 of a kind on a roll results in the number on the die being multiplied by 100 (for example, three 4's = 400 points). The only exception is ones where is a player rolls three one's it results in 1000 points. The game ends when a player reaches 5000 points.

## Features

- Firebase authentication (Google, GitHub, email/password)
- Create and join game lobbies
- Real-time dice and turn state updates
- Real-time lobby chat
- Player profiles (display name, preferred color, wins)
- Final-round and game-over handling

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- Express + GraphQL (graphql-http)
- GraphQL subscriptions (graphql-ws + ws)
- Firebase Auth
- Firestore + Realtime Database
- Firebase Admin SDK

## Demo

<video src="https://github.com/user-attachments/assets/a07c85f1-6c46-450c-a660-079f352baa6d" controls="controls"></video>




## Repository Layout

All commands below should be run from:

```bash
cd dice5000
```

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with:
	- Authentication enabled
	- Firestore enabled
	- Realtime Database enabled
- Firebase service account JSON for server-side Admin SDK

## Environment Variables

Do not commit real secrets.

Create `dice5000/.env.local` with values like:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_public_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql

# Path relative to dice5000/ folder
GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json
```

Notes:

- `GOOGLE_APPLICATION_CREDENTIALS` is required by the server.
- Keep `serviceAccount.json` private and out of git.
- `NEXT_PUBLIC_*` values are client-exposed by design.

## Install

```bash
cd dice5000
npm install
```

## Run Locally

Use two terminals from `dice5000/`:

Terminal 1 (GraphQL game server):

```bash
npm run server
```

Terminal 2 (Next.js app):

```bash
npm run dev
```

Then open:

- Frontend: http://localhost:3000
- GraphQL endpoint: http://localhost:4000/graphql

## NPM Scripts

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build frontend
- `npm run start` - Start frontend in production mode
- `npm run server` - Start GraphQL/Express game server with `.env.local`
- `npm run lint` - Run ESLint

## How Realtime Works

- Queries and mutations use HTTP requests to `/graphql`.
- Subscriptions use WebSockets to `/graphql`.
- Client subscription handlers listen for:
	- message updates
	- game state updates
	- dice state updates


## Improvements

- Game logic is not perfect
- No reconnection for active lobbies
- No match history for viewing past games

## Known Issues

- No real sign up for just email and password
- Only the host can start a game
- Need to move more things to the server side
