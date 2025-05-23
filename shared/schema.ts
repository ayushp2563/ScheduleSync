import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduleImages = pgTable("schedule_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalText: text("original_text"),
  processingStatus: text("processing_status").notNull().default("uploading"), // uploading, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const extractedEvents = pgTable("extracted_events", {
  id: serial("id").primaryKey(),
  scheduleImageId: integer("schedule_image_id").references(() => scheduleImages.id).notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  location: text("location"),
  description: text("description"),
  googleEventId: text("google_event_id"),
  isConfirmed: boolean("is_confirmed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleImageSchema = createInsertSchema(scheduleImages).omit({
  id: true,
  createdAt: true,
});

export const insertExtractedEventSchema = createInsertSchema(extractedEvents).omit({
  id: true,
  createdAt: true,
});

// Update schemas
export const updateExtractedEventSchema = createInsertSchema(extractedEvents).omit({
  id: true,
  scheduleImageId: true,
  createdAt: true,
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ScheduleImage = typeof scheduleImages.$inferSelect;
export type InsertScheduleImage = z.infer<typeof insertScheduleImageSchema>;

export type ExtractedEvent = typeof extractedEvents.$inferSelect;
export type InsertExtractedEvent = z.infer<typeof insertExtractedEventSchema>;
export type UpdateExtractedEvent = z.infer<typeof updateExtractedEventSchema>;

// API Response types
export const parsedEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const parseScheduleResponseSchema = z.object({
  events: z.array(parsedEventSchema),
  confidence: z.number(),
  originalText: z.string(),
});

export type ParsedEvent = z.infer<typeof parsedEventSchema>;
export type ParseScheduleResponse = z.infer<typeof parseScheduleResponseSchema>;
