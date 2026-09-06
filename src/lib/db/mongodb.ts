import { MongoClient } from "mongodb";

import { env } from "@/lib/env";

declare global {
  var mongoClient: MongoClient | undefined;
}

export function getMongoClient() {
  if (!globalThis.mongoClient) {
    globalThis.mongoClient = new MongoClient(env.MONGODB_URI);
  }

  return globalThis.mongoClient;
}