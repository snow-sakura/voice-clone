import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 用户表
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name"),
  avatar: text("avatar"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

// 会话表
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires_at: text("expires_at").notNull(),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// 活动记录表
export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'clone' | 'tts' | 'delete_voice' | 'login' | 'register'
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON 字符串
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// 活动类型联合类型
export type ActivityType = 'clone' | 'tts' | 'delete_voice' | 'login' | 'register';

// 克隆音色表
export const clonedVoices = sqliteTable("cloned_voices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  voice_id: text("voice_id").unique(),
  model: text("model").notNull().default("qwen-voice-enrollment"),
  status: text("status").notNull().default("pending"),
  demo_audio_url: text("demo_audio_url"),
  audio_file_path: text("audio_file_path"),
  error_message: text("error_message"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
