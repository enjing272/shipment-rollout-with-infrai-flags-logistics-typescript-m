import test from "node:test";
import assert from "node:assert/strict";
import { decideShipment } from "./shipment_rollout.ts";

test("enabled delivery accepts proof of delivery", () => {
  const result = decideShipment({ shipmentId: "s-1", event: "delivered", proofOfDelivery: "https://files.example.test/pod/s-1" }, true);
  assert.deepEqual(result, { state: "delivered", acceptedProof: true });
});

test("an exception remains reviewable even when the rollout is enabled", () => {
  const result = decideShipment({ shipmentId: "s-2", event: "exception", exceptionCode: "address_mismatch" }, true);
  assert.deepEqual(result, { state: "exception_review", acceptedProof: false });
});
