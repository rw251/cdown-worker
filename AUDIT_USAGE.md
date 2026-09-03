# Historic Episode Audit Usage Guide

## Overview

The audit system automatically checks and updates historic Countdown episodes by comparing the current wiki content with stored data. It runs as a separate hourly cron job and processes up to 10 episodes per hour. The start and end can be set in config.

## How It Works

- **Cron Schedule**: Runs once an hour at minute 31 (`31 * * * *`), away from the regular episode fetch
- **Batch Size**: Processes 10 episodes per run
- **Throttling**: 2-second delay between episode fetches, plus MediaWiki's `maxlag` protection
- **Storage**: Uses KV for state management and R2 for episode data
- **Progress Reports**: Sends email updates every 8 hours
- **Final Report**: Comprehensive email when complete with all updates
- **Availability Alerts**: Sends one email when wiki reads start failing and another when they recover

## Starting an Audit

Log in to the cloudflare dashboard, navigate to the KV store, then the cdown-get-latest-cdown namespace. Set the `AUDIT_CONFIG` key with a JSON value like:

```json
{ "minEpisode": 1, "maxEpisode": 2000, "isDryRun": false }
```

Then delete `AUDIT_COMPLETE` key if it exists. The audit will start on the next cron run.

## Daily limits

Currently you are limited to 1000 KV write per day (across all projects). When this was first run it could only do about 1500-2000 episodes a day. However now that most episodes are already up to date it can probably do more. Just be careful.
