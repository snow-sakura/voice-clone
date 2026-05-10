import { db } from "./index";
import { clonedVoices, users, sessions, activities } from "./schema";
import { eq, desc, sql, and, isNull, or } from "drizzle-orm";

export async function createVoice(
  name: string,
  model: string,
  audioFilePath: string,
  userId?: number,
) {
  const now = new Date().toISOString();
  const [voice] = await db
    .insert(clonedVoices)
    .values({
      name,
      model,
      audio_file_path: audioFilePath,
      status: "pending",
      user_id: userId ?? null,
      created_at: now,
      updated_at: now,
    })
    .returning();

  return voice;
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

// ========== 用户相关查询 ==========

export async function createUser(
  email: string,
  passwordHash: string,
  name?: string,
) {
  const now = new Date().toISOString();
  const [user] = await db
    .insert(users)
    .values({
      email,
      password_hash: passwordHash,
      name: name ?? null,
      created_at: now,
      updated_at: now,
    })
    .returning();

  return user;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function updateUser(id: number, data: { name?: string; avatar?: string }) {
  const [user] = await db
    .update(users)
    .set({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .where(eq(users.id, id))
    .returning();

  return user;
}

// ========== 会话相关查询 ==========

export async function createSession(userId: number, token: string, expiresAt: string) {
  const [session] = await db
    .insert(sessions)
    .values({
      user_id: userId,
      token,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    })
    .returning();

  return session;
}

export async function getSessionByToken(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token));

  return session;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteExpiredSessions() {
  const now = new Date().toISOString();
  await db.delete(sessions).where(sql`${sessions.expires_at} < ${now}`);
}

// ========== 活动相关查询 ==========

export async function createActivity(
  userId: number,
  type: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  const [activity] = await db
    .insert(activities)
    .values({
      user_id: userId,
      type,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    })
    .returning();

  return activity;
}

export async function getActivitiesByUserId(userId: number, limit = 20) {
  const items = await db
    .select()
    .from(activities)
    .where(eq(activities.user_id, userId))
    .orderBy(desc(activities.created_at))
    .limit(limit);

  return items.map((item) => ({
    ...item,
    metadata: item.metadata ? JSON.parse(item.metadata) : null,
  }));
}

export async function getActivityCountByUserId(userId: number, type?: string) {
  const conditions = type
    ? and(eq(activities.user_id, userId), eq(activities.type, type))
    : eq(activities.user_id, userId);

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(conditions);

  return Number(result?.count ?? 0);
}

export async function getTodayTtsCount(userId: number) {
  const today = new Date().toISOString().split("T")[0];
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        eq(activities.user_id, userId),
        eq(activities.type, "tts"),
        sql`date(${activities.created_at}) = ${today}`,
      ),
    );

  return Number(result?.count ?? 0);
}

// ========== 统计相关查询 ==========

export async function getVoiceCountByUserId(userId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clonedVoices)
    .where(eq(clonedVoices.user_id, userId));

  return Number(result?.count ?? 0);
}

export async function getCompletedVoiceCountByUserId(userId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clonedVoices)
    .where(
      and(
        eq(clonedVoices.user_id, userId),
        eq(clonedVoices.status, "completed"),
      ),
    );

  return Number(result?.count ?? 0);
}

// 获取用户的音色列表（支持兼容旧数据）
export async function getVoicesByUserId(userId: number, page: number, pageSize: number) {
  const offset = (page - 1) * pageSize;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(clonedVoices)
      .where(
        or(
          eq(clonedVoices.user_id, userId),
          isNull(clonedVoices.user_id), // 兼容旧数据
        ),
      )
      .orderBy(desc(clonedVoices.created_at))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(clonedVoices)
      .where(
        or(
          eq(clonedVoices.user_id, userId),
          isNull(clonedVoices.user_id),
        ),
      ),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);

  return { items, total };
}
