import { db } from "./index";
import { clonedVoices } from "./schema";
import { eq, desc } from "drizzle-orm";

export async function getVoiceByTaskId(taskId: string) {
  const [voice] = await db
    .select()
    .from(clonedVoices)
    .where(eq(clonedVoices.task_id, taskId));
  return voice;
}

export async function createVoice(
  name: string,
  model: string,
  audioFilePath: string,
  taskId?: string,
) {
  const [voice] = await db
    .insert(clonedVoices)
    .values({
      name,
      model,
      audio_file_path: audioFilePath,
      task_id: taskId || null,
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

export async function getVoiceById(id: number) {
  const [voice] = await db
    .select()
    .from(clonedVoices)
    .where(eq(clonedVoices.id, id));

  return voice;
}

export async function updateVoiceStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "failed",
) {
  const [voice] = await db
    .update(clonedVoices)
    .set({
      status,
      updated_at: new Date().toISOString(),
    })
    .where(eq(clonedVoices.id, id))
    .returning();

  return voice;
}

export async function updateVoiceOnComplete(
  id: number,
  speakerId: string,
  demoAudioUrl: string,
) {
  const [voice] = await db
    .update(clonedVoices)
    .set({
      speaker_id: speakerId,
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
