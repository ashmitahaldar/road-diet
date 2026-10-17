# Road Diet

Every street has a budget. How would you spend it?

A short game where you redesign a Toronto street's limited road space and see how it affects four fictional residents, plus emissions, safety and fairness. A learning tool, not a forecast.

## Develop

```bash
npm install
npm run dev    # server on :3000, client on :5173 (proxies /api)
npm test       # vitest in shared/
npm run build
```

Copy `.env.example` to `.env` for local secrets. Never commit `.env`.
