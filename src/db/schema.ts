import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const clonedVoices = sqliteTable("cloned_voices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  speaker_id: text("speaker_id").unique(),
  model: text("model").notNull().default("V3"),
  task_id: text("task_id"),
  status: text("status").notNull().default("pending"),
  demo_audio_url: text("demo_audio_url"),
  audio_file_path: text("audio_file_path"),
  error_message: text("error_message"),
  created_at: text("created_at").notNull().default("(datetime('now'))"),
  updated_at: text("updated_at").notNull().default("(datetime('now'))"),
});
