import type { SimpleImportInput } from "../schema";

import { migrateV1 } from "./v1";

export function runImportMigrations(input: SimpleImportInput) {
  switch (input.schemaVersion) {
    case 1:
      return migrateV1(input);
    default:
      throw new Error(`Unsupported schemaVersion: ${input.schemaVersion}`);
  }
}
