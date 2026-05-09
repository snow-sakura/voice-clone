import { db } from "./index";
import { clonedVoices } from "./schema";
import { eq, desc, sql } from "drizzle-orm";

export async function createVoice(
  name: string,
  model: string,
  audioFilePath: string,
) {
  const [voice] = await db
    .insert(clonedVoices)
    .values({
      name,
      model,
      audio_file_path: audioFilePath,
      status: "pending",
    })
    .returning();

  return voice;
}

export async function getVoices() {
  return db
    .select()
    .from(clonedVoices)
    .orderBy(desc(clonedVoices.created_at));
}

export async function getVoicesPaginated(page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(clonedVoices)
      .orderBy(desc(clonedVoices.created_at))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(clonedVoices),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  return { items, total };
}

export async function getVoiceById(id: number) {
  const [voice] = await db
    .select()
    .from(clonedVoices)
    .where(eq(clonedVoices.id, id));

  return voice;
}

export async function updateVoiceOnComplete(
  id: number,
  voiceId: string,
  demoAudioUrl: string,
) {
  const [voice] = await db
    .update(clonedVoices)
    .set({
      voice_id: voiceId,
      demo_audio_url: demoAudioUrl,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .where(eq(clonedVoices.id, id))
    .returning();

  return voice;
}

export async function updateVoiceOnFail(
  id: number,
  errorMessage: string,
) {
  const [voice] = await db
    .update(clonedVoices)
    .set({
      error_message: errorMessage,
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .where(eq(clonedVoices.id, id))
    .returning();

  return voice;
}

export async function deleteVoice(id: number) {
  const [voice] = await db
    .delete(clonedVoices)
    .where(eq(clonedVoices.id, id))
    .returning();

  return voice;
}
