import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { extractTextFromImage } from "./lib/google-vision";
import { parseScheduleText } from "./lib/openai";
import { getAuthUrl, getTokensFromCode, createCalendarEvents } from "./lib/google-calendar";
import { 
  insertScheduleImageSchema, 
  insertExtractedEventSchema,
  updateExtractedEventSchema,
  type ParseScheduleResponse 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, JPEG, and WebP are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a simple session system (in production, use proper session management)
  let currentUserId = 1;

  // Ensure uploads directory exists
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Google OAuth routes
  app.get('/api/auth/google', (req, res) => {
    try {
      const authUrl = getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ message: 'Failed to generate authentication URL' });
    }
  });

  app.get('/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Authorization code is required');
      }

      const { accessToken, refreshToken } = await getTokensFromCode(code);
      
      // Update user tokens (for now, just use a default user)
      await storage.updateUserTokens(currentUserId, accessToken, refreshToken);
      
      // Redirect back to the app with success
      res.redirect('/?connected=true');
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Check authentication status
  app.get('/api/auth/status', async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      const isConnected = !!(user?.googleAccessToken);
      res.json({ isConnected });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check auth status' });
    }
  });

  // Upload and process schedule image
  app.post('/api/upload-schedule', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Create schedule image record
      const scheduleImage = await storage.createScheduleImage({
        userId: currentUserId,
        filename: req.file.filename,
        processingStatus: 'processing',
      });

      // Start processing asynchronously
      processScheduleImage(scheduleImage.id, req.file.path)
        .catch(error => {
          console.error('Error processing schedule image:', error);
          storage.updateScheduleImageStatus(scheduleImage.id, 'failed');
        });

      res.json({ 
        scheduleImageId: scheduleImage.id,
        message: 'Image uploaded successfully, processing started' 
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Get processing status and results
  app.get('/api/schedule/:id', async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const scheduleImage = await storage.getScheduleImage(scheduleId);
      
      if (!scheduleImage) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      const events = await storage.getExtractedEventsByScheduleId(scheduleId);
      
      res.json({
        schedule: scheduleImage,
        events,
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ message: 'Failed to fetch schedule' });
    }
  });

  // Update an extracted event
  app.patch('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const updates = updateExtractedEventSchema.parse(req.body);
      
      const updatedEvent = await storage.updateExtractedEvent(eventId, updates);
      res.json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Failed to update event' });
    }
  });

  // Delete an extracted event
  app.delete('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      await storage.deleteExtractedEvent(eventId);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Failed to delete event' });
    }
  });

  // Create calendar events
  app.post('/api/create-calendar-events', async (req, res) => {
    try {
      const { eventIds } = req.body;
      
      if (!eventIds || !Array.isArray(eventIds)) {
        return res.status(400).json({ message: 'Event IDs array is required' });
      }

      const user = await storage.getUser(currentUserId);
      if (!user?.googleAccessToken) {
        return res.status(401).json({ message: 'Google Calendar not connected' });
      }

      // Get the events to create
      const events = [];
      for (const eventId of eventIds) {
        const event = await storage.getExtractedEventsByScheduleId(eventId);
        if (event.length > 0) {
          events.push(...event);
        }
      }

      if (events.length === 0) {
        return res.status(400).json({ message: 'No valid events found' });
      }

      // Create calendar events
      const createdEvents = await createCalendarEvents(
        user.googleAccessToken,
        user.googleRefreshToken || '',
        events.map(event => ({
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime || undefined,
          location: event.location || undefined,
          description: event.description || undefined,
        }))
      );

      // Update events with Google event IDs
      for (let i = 0; i < createdEvents.length && i < events.length; i++) {
        await storage.updateEventGoogleId(events[i].id, createdEvents[i].eventId);
      }

      res.json({
        message: 'Events created successfully',
        createdEvents,
      });
    } catch (error) {
      console.error('Error creating calendar events:', error);
      res.status(500).json({ message: 'Failed to create calendar events' });
    }
  });

  // Helper function to process schedule images
  async function processScheduleImage(scheduleImageId: number, filePath: string) {
    try {
      // Update status to processing
      await storage.updateScheduleImageStatus(scheduleImageId, 'processing');

      // Read the image file
      const imageBuffer = fs.readFileSync(filePath);
      const imageBase64 = imageBuffer.toString('base64');

      // Extract text using Google Vision API
      const extractedText = await extractTextFromImage(imageBuffer);
      
      // Update with extracted text
      await storage.updateScheduleImageStatus(scheduleImageId, 'processing', extractedText);

      // Parse the schedule using OpenAI
      const parseResult = await parseScheduleText(extractedText, imageBase64);

      // Save extracted events
      for (const event of parseResult.events) {
        await storage.createExtractedEvent({
          scheduleImageId,
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime || null,
          location: event.location || null,
          description: event.description || null,
        });
      }

      // Update status to completed
      await storage.updateScheduleImageStatus(scheduleImageId, 'completed');

      // Clean up the uploaded file
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error processing schedule image:', error);
      await storage.updateScheduleImageStatus(scheduleImageId, 'failed');
      
      // Clean up the uploaded file even on error
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
