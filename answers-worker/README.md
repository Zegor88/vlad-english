# Private answer service

The GitHub Pages site stays public and static. This Worker is a separate API that stores only structured quiz events:

- anonymous device token generated in Safari (64 random hex characters);
- quiz id, question id, selected option, right/wrong, server timestamp.

It does **not** receive a child name, school, free-text response, voice, photo, email, or a GitHub token.

## Deployment prerequisites

1. A Cloudflare account controlled by the parent.
2. A D1 database called `vlad_english_answers`.
3. Authentication for Wrangler / a scoped Cloudflare API token — it is entered only in Cloudflare or GitHub Secrets, never pasted into chat or committed.

## Deploy

```bash
wrangler d1 create vlad_english_answers
# copy the returned database_id into wrangler.jsonc
wrangler d1 execute vlad_english_answers --remote --file=schema.sql
wrangler deploy
```

After live verification, place only the public Worker URL in `../repo/answers-config.js`, commit and publish the static site. No credential goes into that file.

## Local verification

```bash
node --test tests/worker.test.mjs
wrangler d1 execute vlad_english_answers --local --file=schema.sql
wrangler dev --local
```
