import { 
  users, 
  scheduleImages, 
  extractedEvents,
  type User, 
  type InsertUser,
  type ScheduleImage,
  type InsertScheduleImage,
  type ExtractedEvent,
  type InsertExtractedEvent,
  type UpdateExtractedEvent
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(id: number, accessToken: string, refreshToken: string): Promise<User>;

  // Schedule Images
  createScheduleImage(scheduleImage: InsertScheduleImage): Promise<ScheduleImage>;
  getScheduleImage(id: number): Promise<ScheduleImage | undefined>;
  updateScheduleImageStatus(id: number, status: string, originalText?: string): Promise<ScheduleImage>;
  getUserScheduleImages(userId: number): Promise<ScheduleImage[]>;

  // Extracted Events
  createExtractedEvent(event: InsertExtractedEvent): Promise<ExtractedEvent>;
  getExtractedEventsByScheduleId(scheduleImageId: number): Promise<ExtractedEvent[]>;
  updateExtractedEvent(id: number, updates: UpdateExtractedEvent): Promise<ExtractedEvent>;
  deleteExtractedEvent(id: number): Promise<void>;
  updateEventGoogleId(id: number, googleEventId: string): Promise<ExtractedEvent>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scheduleImages: Map<number, ScheduleImage>;
  private extractedEvents: Map<number, ExtractedEvent>;
  private currentUserId: number;
  private currentScheduleImageId: number;
  private currentEventId: number;

  constructor() {
    this.users = new Map();
    this.scheduleImages = new Map();
    this.extractedEvents = new Map();
    this.currentUserId = 1;
    this.currentScheduleImageId = 1;
    this.currentEventId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      googleAccessToken: null,
      googleRefreshToken: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { 
      ...user, 
      googleAccessToken: accessToken, 
      googleRefreshToken: refreshToken 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Schedule Images
  async createScheduleImage(insertScheduleImage: InsertScheduleImage): Promise<ScheduleImage> {
    const id = this.currentScheduleImageId++;
    const scheduleImage: ScheduleImage = {
      ...insertScheduleImage,
      id,
      originalText: null,
      createdAt: new Date(),
    };
    this.scheduleImages.set(id, scheduleImage);
    return scheduleImage;
  }

  async getScheduleImage(id: number): Promise<ScheduleImage | undefined> {
    return this.scheduleImages.get(id);
  }

  async updateScheduleImageStatus(id: number, status: string, originalText?: string): Promise<ScheduleImage> {
    const scheduleImage = this.scheduleImages.get(id);
    if (!scheduleImage) {
      throw new Error('Schedule image not found');
    }
    const updated = { ...scheduleImage, processingStatus: status };
    if (originalText !== undefined) {
      updated.originalText = originalText;
    }
    this.scheduleImages.set(id, updated);
    return updated;
  }

  async getUserScheduleImages(userId: number): Promise<ScheduleImage[]> {
    return Array.from(this.scheduleImages.values()).filter(
      (image) => image.userId === userId
    );
  }

  // Extracted Events
  async createExtractedEvent(insertEvent: InsertExtractedEvent): Promise<ExtractedEvent> {
    const id = this.currentEventId++;
    const event: ExtractedEvent = {
      ...insertEvent,
      id,
      googleEventId: null,
      isConfirmed: false,
      createdAt: new Date(),
    };
    this.extractedEvents.set(id, event);
    return event;
  }

  async getExtractedEventsByScheduleId(scheduleImageId: number): Promise<ExtractedEvent[]> {
    return Array.from(this.extractedEvents.values()).filter(
      (event) => event.scheduleImageId === scheduleImageId
    );
  }

  async updateExtractedEvent(id: number, updates: UpdateExtractedEvent): Promise<ExtractedEvent> {
    const event = this.extractedEvents.get(id);
    if (!event) {
      throw new Error('Event not found');
    }
    const updated = { ...event, ...updates };
    this.extractedEvents.set(id, updated);
    return updated;
  }

  async deleteExtractedEvent(id: number): Promise<void> {
    this.extractedEvents.delete(id);
  }

  async updateEventGoogleId(id: number, googleEventId: string): Promise<ExtractedEvent> {
    const event = this.extractedEvents.get(id);
    if (!event) {
      throw new Error('Event not found');
    }
    const updated = { ...event, googleEventId };
    this.extractedEvents.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
