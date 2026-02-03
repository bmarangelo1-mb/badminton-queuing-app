# Intelligent Queueing App

A badminton-oriented web app for managing doubles matches. Add players by category (Beginners / Intermediate), set the number of courts, then queue matches that respect skill-based pairing rules.

## Features

- **Courts**: Configure 1–10 courts.
- **Categories**: Each player is Beginners or Intermediate.
- **Match types** (random pairing):
  - 2 Beginners vs 2 Beginners
  - 1 Beginner + 1 Intermediate vs 1 Beginner + 1 Intermediate
  - 2 Intermediate vs 2 Intermediate
- **Player status**: Playing vs Waiting, with a games-played counter.
- **Two-phase flow**: Setup (add players, set courts) → Start Queue → Create matches manually, complete them, then create more as courts free up.

## Tech

- React 19 + Vite 7
- Tailwind CSS v4

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Usage

1. **Setup**: Set number of courts, add all players (name + category).
2. Click **Start Queue** (requires at least 4 players).
3. **Active**: View all players (status, games played). Click **Create next match** to assign a match to an available court when enough players are waiting.
4. Click **Complete match** when a game ends; those 4 players go back to the end of the queue and their games-played count increases.
5. Add or remove players anytime, including during active queueing.
