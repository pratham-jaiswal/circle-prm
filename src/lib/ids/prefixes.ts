export const publicIdPrefixes = [
  "PER",
  "SVW",
  "NOTE",
  "REM",
  "INT",
  "REL",
  "EVT",
  "FACT",
  "DATE",
  "LINK",
] as const;

export type PublicIdPrefix = (typeof publicIdPrefixes)[number];