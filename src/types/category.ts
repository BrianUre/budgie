import { z } from "zod";

export const categoryColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #RRGGBB");

export const DEFAULT_CATEGORY_COLOR = "#94a3b8";
