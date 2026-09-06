import { randomInt } from "crypto";

import type { PublicIdPrefix } from "./prefixes";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSegment(length = 6) {
  let segment = "";

  for (let index = 0; index < length; index += 1) {
    segment += alphabet[randomInt(alphabet.length)];
  }

  return segment;
}

export function generatePublicId(prefix: PublicIdPrefix) {
  return `${prefix}_${generateSegment()}`;
}