import { eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { profile, type Profile } from "@/db/schema";

export function createProfile(db: Db, name: string): Profile {
  return db.insert(profile).values({ id: 1, name }).returning().get();
}

export function updateProfileName(db: Db, name: string): Profile | undefined {
  return db
    .update(profile)
    .set({ name })
    .where(eq(profile.id, 1))
    .returning()
    .get();
}