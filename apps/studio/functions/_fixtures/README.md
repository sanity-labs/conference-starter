# Function Test Fixtures

JSON fixtures for testing Sanity Functions locally with `sanity functions test`.

## Usage

From `apps/studio/`:

```bash
# Test daily-digest (scheduled — no payload needed, uses --with-user-token to query Sanity)
npx sanity functions test daily-digest --with-user-token

# Test reminder-cron (same pattern)
npx sanity functions test reminder-cron --with-user-token

# Test document event functions with fixture files
npx sanity functions test send-cfp-confirmation \
  --file functions/_fixtures/submission-create.json \
  --event create

npx sanity functions test send-announcement-email \
  --file-before functions/_fixtures/announcement-before.json \
  --file-after functions/_fixtures/announcement-after.json \
  --event update
```

## Notes

- Scheduled functions (`daily-digest`, `reminder-cron`) don't use payload files — they query Sanity directly. Use `--with-user-token` so they can authenticate.
- `context.local` is `true` during local testing, which activates dry-run mode in all email/Telegram sends.
- The `CONFERENCE_TIMEZONE` env var can override the default `America/New_York` timezone.
