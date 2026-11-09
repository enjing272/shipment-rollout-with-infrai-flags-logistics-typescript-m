import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const shipmentRequest = z.object({
  shipmentId: z.string().min(1),
  event: z.enum(["picked_up", "in_transit", "delivered", "exception"]),
  proofOfDelivery: z.string().url().optional(),
  exceptionCode: z.string().min(1).optional(),
});
export type ShipmentRequest = z.infer<typeof shipmentRequest>;

export function decideShipment(request: ShipmentRequest, enabled: boolean): { state: string; acceptedProof: boolean } {
  if (request.event === "exception") return { state: "exception_review", acceptedProof: false };
  if (!enabled) return { state: "incumbent_path", acceptedProof: false };
  return { state: request.event, acceptedProof: request.event === "delivered" && Boolean(request.proofOfDelivery) };
}

export async function runShipment(requestBody: unknown, client: InfraiClient, flagKey: string, userId: string) {
  const request = shipmentRequest.parse(requestBody);
  const value = await client.getFlagValue(flagKey, userId);
  const enabled = value === true || (typeof value === "object" && value !== null && "value" in value && (value as { value: unknown }).value === true);
  return { shipmentId: request.shipmentId, decision: decideShipment(request, enabled) };
}

export async function scheduleStages(client: InfraiClient, taskUrl: string) {
  return client.scheduleRollout(taskUrl, "0 * * * *");
}

if (import.meta.main) {
  const key = process.env.INFRAI_API_KEY;
  const flagKey = process.env.INFRAI_FLAG_KEY;
  const userId = process.env.INFRAI_USER_ID;
  if (!key || !flagKey || !userId) throw new Error("Set INFRAI_API_KEY, INFRAI_FLAG_KEY, and INFRAI_USER_ID");
  const client = new InfraiClient(key);
  const result = await runShipment({ shipmentId: "demo-shipment", event: "delivered", proofOfDelivery: "https://files.example.test/pod/demo" }, client, flagKey, userId);
  console.log(JSON.stringify(result));
}
