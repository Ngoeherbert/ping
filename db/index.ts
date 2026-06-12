import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let dbInstance: any;

// Detect if we are executing within a client-side mobile environment
const isClient =
  typeof window !== "undefined" ||
  process.env.EXPO_OS === "ios" ||
  process.env.EXPO_OS === "android";

if (isClient) {
  // Feed Metro a hollow placeholder so it compiles without execution crashing
  dbInstance = {} as any;
} else {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "No database connection string was provided to neon(). Check your server environment.",
    );
  }
  const sql = neon(process.env.DATABASE_URL);
  dbInstance = drizzle(sql, { schema });
}

export const db = dbInstance;
