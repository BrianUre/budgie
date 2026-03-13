import { z } from "zod";

export type DestinationType = "bank_account" | "bizum";

export const destinationTypeSchema = z.enum(["bank_account", "bizum"]);
