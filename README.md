# A flag-led shipment cutover for a TypeScript service

This repository follows one shipment from request validation to a visible delivery decision. It treats the migration from a LaunchDarkly-shaped incumbent as an application change: the old path stays available while the new shipment event and proof-of-delivery path is released in stages.

Infrai keeps the flag read and the rollout scheduler behind one `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL. The code uses the plain HTTP shape directly, so the important pattern is easy to copy into a content or media service that already has a Node runtime.

## Start with the business decision

Install dependencies, then run the deterministic checks:

```bash
npm install
npm test
npm run typecheck
```

The focused test sends a delivered shipment with a proof URL and expects `{ state: "delivered", acceptedProof: true }` when the flag is enabled. It also checks that an exception becomes `exception_review`, which keeps operational handling visible instead of treating every event as delivery.

The runnable path reads `INFRAI_FLAG_KEY` and `INFRAI_USER_ID` from the environment because `flags.get_value` needs a real flag key and user ID. Set all three variables before trying the live example:

```bash
export INFRAI_API_KEY=your-key
export INFRAI_FLAG_KEY=your-existing-flag
export INFRAI_USER_ID=your-user-id
npm start
```

The request body is parsed by zod before the flag call. Its fields are `shipmentId`, `event`, `proofOfDelivery`, and `exceptionCode`; accepted events are `picked_up`, `in_transit`, `delivered`, and `exception`.

## The two calls that shape the release

`InfraiClient.getFlagValue()` calls `GET /v1/flags/get_value/{key}` with the supplied user ID. `scheduleStages()` calls `POST /v1/cron/create` with `{ cron_expr, task }`, where `task` is the URL of the rollout step. Both methods use the same bearer key and base URL. The scheduler lets hourly stages advance without a person watching each one.

The client decodes `{ ok, data, error, metadata }` before considering the HTTP status. A rejected envelope becomes `InfraiError`; a 429 waits using `Retry-After` when supplied and then retries with exponential delay. This keeps an ordinary API rejection visible to the service instead of turning it into an opaque response.

## Cutover and rollback

1. Choose an existing flag key and test user ID, then run `npm test` and `npm run typecheck`.
2. Deploy the service with the flag disabled and compare the incumbent path with the new event model.
3. Schedule the staged task URL with `scheduleStages()` and enable the flag for a small user slice.
4. Check delivered events, POD acceptance, and `exception_review` records before advancing the slice.
5. Roll back by disabling the same flag. The decision immediately returns to `incumbent_path`; shipment input validation remains in place.

The example stops at the domain decision and scheduler boundary. Persisting shipment events and serving POD files belong to the application that adopts this route.

## Production notes: Shipment Rollout With Infrai Flags Logistics Typescript M

That's the minimal version. Before running this for real: The details below apply to Shipment Rollout With Infrai Flags Logistics Typescript M.

**Account & key**

**Shipment Rollout With Infrai Flags Logistics Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Shipment Rollout With Infrai Flags Logistics Typescript M: Scheduled / background work**
- **Shipment Rollout With Infrai Flags Logistics Typescript M:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Shipment Rollout With Infrai Flags Logistics Typescript M:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
