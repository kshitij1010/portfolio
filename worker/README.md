# Optional portfolio AI summaries

The website and its source-grounded copilot work as static files on GitHub Pages. This directory adds an **optional**, separately hosted Cloudflare Worker for short OpenAI or Anthropic summaries. AI is disabled in the checked-in configuration. No API key, account session, or paid request is needed to run the portfolio.

The browser retrieves a topic locally from `assets/data/knowledge.json`. This backend accepts only its allowlisted `topicId`. It does not accept a visitor question, conversation, uploaded document, custom instruction, model name, or system prompt. It summarizes the deployed catalog record and returns its original source links. This intentionally gives up arbitrary conversation to keep the endpoint restricted to Kshitij's documented experience, projects, publications, and interests. Planned projects retain their planned status in the catalog and summary instructions.

## Contract

```http
POST /chat
Origin: https://kshitij1010.github.io
Content-Type: application/json

{"topicId":"experience"}
```

Use an actual ID from the deployed catalog; `experience` is illustrative. Extra fields, unknown topics, URL query parameters, compressed request bodies, or bodies over 256 bytes are rejected before a model call.

```json
{
  "answer": "A short summary of the selected portfolio topic.",
  "topicId": "experience",
  "sources": [{ "label": "Experience", "url": "#experience" }],
  "cached": false
}
```

Errors use `{ "error": "code", "message": "human-readable message" }`. On any error, the client should show its local source notes and should not retry automatically. A source URL may be relative to the portfolio, so resolve it against the website, not the Worker origin. Render generated text as text, never HTML. The backend rejects HTML and links in generated summaries; source links always come from the catalog.

## Usage controls

One named SQLite Durable Object holds the budget, cache, and client counters. Request and token reservations are committed in an atomic storage transaction **before** the provider request. Concurrent requests cannot overshoot these configured reservation or call counts. A missing binding, unavailable storage, missing secret/model, invalid limit, or disabled configuration fails closed.

| Default limit | Value |
| --- | --- |
| Model requests | 25/day, 120/month |
| Reserved token units | 160,000/day, 800,000/month |
| All accepted topic requests, including cache hits | 500/day, 5,000/month |
| Requests per client IP | 8/hour, 24/day |
| Model output allowance | 300 tokens |
| Provider timeout / retries | 10 seconds / none |
| Topic cache | 7 days, at most 16 entries |
| Stored client counters | At most 256 per UTC day |

Token reservations use the UTF-8 byte count of the fixed instructions and topic, plus 1,024 units for framing and the full output allowance. This is a conservative accounting estimate, **not provider-measured billing or a guaranteed dollar cap**. Call counts and provider output caps are exact; input facts are limited to 5,000 bytes. Prices and tokenization depend on the explicit model you choose. Failed, timed-out, and incomplete calls retain their full reservations because they may still be billed. Provider-side project budgets and monitoring remain useful. Hosting traffic/storage limits are separate from model limits.

Limits reset by UTC day/month inside the same persisted state. Do not rename the named object, delete its storage, or bind another namespace to reset a quota. Deploying a changed catalog invalidates affected cached summaries without resetting budgets. Same-topic requests in flight return `429` instead of starting duplicate model calls. A new model or provider also invalidates cached summaries.

The edge's `CF-Connecting-IP` is HMAC-hashed with a secret and the current UTC day. Raw IPs and visitor questions are not stored or sent to a model. Client counters are cleared on the next request after a UTC day changes. Different visitors behind a shared IP share a limit. Cloudflare/provider infrastructure may retain its own operational data under its policies. Application observability is disabled by default and this code emits no logs.

Origin checks permit exactly `https://kshitij1010.github.io`. CORS is a browser control, not authentication: scripts outside browsers can forge an Origin header. The finite topic contract and globally persisted limits therefore enforce scope and cap model calls even when the Origin header is forged. For additional traffic-abuse protection, configure Cloudflare protections for the Worker. The endpoint never executes tools, crawls URLs, or retrieves private files.

## Optional activation

Use provider API credentials dedicated to this portfolio. Do not put API keys or ChatGPT/Claude login sessions in browser JavaScript, HTML, repository files, or the knowledge catalog. This integration does not use consumer Pro sign-in sessions. OpenAI documents server-side API key authentication, and Anthropic documents its API authentication and Messages interface. See the official references below.

1. Review public facts and sources in `assets/data/knowledge.json` and choose a supported text model in your provider account. Set `AI_PROVIDER` to `openai` or `anthropic`, and set `AI_MODEL` to that exact model ID. There is deliberately no model default. Review the limits in `wrangler.jsonc` against that model's pricing.
2. Sign into your own Cloudflare account with Wrangler. From this `worker` directory, validate the bundle, then deploy it with `AI_ENABLED` still `false`:

   ```sh
   npx wrangler login
   npx wrangler deploy --dry-run
   npx wrangler deploy
   ```

3. Add the selected provider's key through a secret prompt. Use only one of these provider commands:

   ```sh
   npx wrangler secret put OPENAI_API_KEY
   # Or, for Anthropic:
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put IP_HASH_SALT
   ```

   Supply a random secret of at least 32 characters for `IP_HASH_SALT`. Use an Anthropic key scoped to one workspace. Secrets must not be committed. The `.gitignore` excludes local `.dev.vars` and `.env` files.
4. Set `AI_ENABLED` to `true`, keep `ALLOW_LOCAL_DEV` at `false`, then deploy. Configure the frontend's optional copilot endpoint to the returned HTTPS Worker URL plus `/chat`. Make one intentional portfolio-topic request, inspect the answer and sources, and check provider usage. This last check consumes API usage; the automated tests do not.
5. To disable paid summaries, set `AI_ENABLED` to `false` and redeploy, and clear the frontend endpoint. The static portfolio and local source answers remain available.

GitHub Pages continues to host the site at the existing domain. Cloudflare and model-provider accounts have their own plans, quotas, and billing; optional remote summaries are not described as free.

For local integration only, set `ALLOW_LOCAL_DEV="true"` and `DEV_ORIGIN="http://127.0.0.1:5178"` explicitly. Only that exact loopback origin is allowed. Production must keep local origins disabled. The edge client header is required; do not replace it with browser-provided identifiers for production.

## Verification

From the repository root with Node 22 or later:

```sh
node --test scripts/test-worker.mjs
```

These tests use a transaction-capable storage stub and mocked provider responses. They cover scope injection, rejected fields, origins, input sizes, missing configuration, provider contracts, persisted caching, simultaneous quota requests, failure reservations, and rate limits. They also validate the real knowledge catalog. They do not deploy to Cloudflare, prove provider model availability, or spend API tokens. Before activation, run the Wrangler dry-run and perform the intentional integration check above.

## Official implementation references

- [OpenAI Responses API parameters](https://developers.openai.com/api/reference/cli/resources/responses/methods/create): fixed instructions/input, output cap, and `store: false`.
- [OpenAI API authentication](https://developers.openai.com/api/reference/overview): server-side API keys.
- [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages/create): system instruction, message content, and `max_tokens`.
- [Anthropic API authentication](https://platform.claude.com/docs/en/api/overview): provider endpoint and API headers.
- [Cloudflare Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/): transactional and persisted quota state.
- [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/) and [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/): optional deployment and secret setup.
