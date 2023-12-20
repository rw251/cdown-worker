When episodes fail...

1. Run in dev mode:

```
npm run dev
```

2. Run Debug Wrangler
3. Navigate to http://localhost:8787/get/XXXX

where XXXX is the episode that failed

4. Debug to find the issue
5. Commit changes and run

```
npm run deploy
```

6. Go to dash.cloudflare.com > Workers and Pages > cdown-get-latest
7. When deployment finished.. go to Routes and enable routes
8. Call https://cdown-get-latest.1234richardwilliams.workers.dev/get/XXXX where ya da ya da to correctly get the episode
9. Then go back to routes and disable the route.
