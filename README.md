# Road Diet

Every street has a budget. How would you spend it?

A short game where you redesign a Toronto street's limited road space and see how it affects four fictional residents, plus emissions, safety and fairness. A learning tool, not a forecast.

## Develop

```bash
npm install
npm run dev    # server on :3000, client on :5173 (proxies /api)
npm test       # vitest in shared/ and server/
npm run build
```

## Run in production

```bash
npm run build
NODE_ENV=production npm start   # one process serves the game and /api on $PORT (default 3000)
```

Copy `.env.example` to `.env` for local secrets. Never commit `.env`.
