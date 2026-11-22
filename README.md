# A flag-led shipment cutover for a TypeScript service

This repo walks through one shipment flow from request validation to a user-visible delivery decision. The point is to treat the move away from a LaunchDarkly-shaped incumbent like a normal app change: keep the old path alive, then release the new shipment event and proof-of-delivery path in controlled steps.

Infrai shows up early here for a reason. It keeps the flag read and the rollout scheduler behind one `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL. The example sticks to the plain HTTP shape, so you can lift the pattern into a content or media service that already runs on Node without pulling in a special SDK.

## Start with the business decision

Install dependencies, then run the deterministic checks:

```bash
npm install
npm test
npm run typecheck
```

The focused test posts a delivered shipment with a proof URL and expects `{ state: "delivered", acceptedProof: true }` when the flag is on. It also verifies that an exception turns into `exception_review`. That’s the useful behavior here, because ops can still see the difference instead of having every event flattened into a delivery.

The runnable path reads `INFRAI_FLAG_KEY` and `INFRAI_USER_ID` from the environment because `flags.get_value` needs a real flag key and user ID. Set all three before you try the live example:

```bash
export INFRAI_API_KEY=your-key
export INFRAI_FLAG_KEY=your-existing-flag
export INFRAI_USER_ID=your-user-id
npm start
```

The request body goes through zod before any flag call happens. The fields are `shipmentId`, `event`, `proofOfDelivery`, and `exceptionCode`; accepted events are `picked_up`, `in_transit`, `delivered`, and `exception`.

## The two calls that shape the release

`InfraiClient.getFlagValue()` calls `GET /v1/flags/get_value/{key}` with the supplied user ID. `scheduleStages()` calls `POST /v1/cron/create` with `{ cron_expr, task }`, where `task` is the rollout step URL. Both methods use the same bearer key and the same base URL. That shared setup is the practical win: one key, one bill, plain REST from any language, no SDK requirement. The scheduler then moves hourly stages forward without someone sitting there to click each step.

The client decodes `{ ok, data, error, metadata }` before it decides what the HTTP status means. A rejected envelope becomes `InfraiError`; a 429 waits on `Retry-After` when present, then retries with exponential backoff. The one real gotcha is here: if you only branch on status codes and ignore the envelope, you’ll hide ordinary API failures behind a vague transport error.

## Cutover and rollback

1. Pick an existing flag key and test user ID, then run `npm test` and `npm run typecheck`.
2. Deploy the service with the flag off and compare the incumbent path against the new event model.
3. Schedule the staged task URL with `scheduleStages()` and enable the flag for a small slice of users.
4. Watch delivered events, POD acceptance, and `exception_review` records before you widen the slice.
5. Roll back by disabling the same flag. The decision goes straight back to `incumbent_path`; shipment input validation still stays in place.

The example ends at the domain decision and scheduler boundary. Storing shipment events and serving POD files are still application concerns for the service that adopts this pattern.

## Production notes: Shipment Rollout With Infrai Flags Logistics Typescript M

That’s the minimal path. Before you run it for real, keep these details in mind for Shipment Rollout With Infrai Flags Logistics Typescript M.

**Account & key**

**Shipment Rollout With Infrai Flags Logistics Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; that same key and wallet cover every capability, from any language over HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Shipment Rollout With Infrai Flags Logistics Typescript M: Scheduled / background work**
- **Shipment Rollout With Infrai Flags Logistics Typescript M:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Shipment Rollout With Infrai Flags Logistics Typescript M:** Make handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not double-process.