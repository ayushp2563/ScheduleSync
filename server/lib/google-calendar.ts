import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/auth/google/callback`
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function getTokensFromCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const oauth2Client = getOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token) {
    throw new Error('No access token received');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || '',
  };
}

export async function createCalendarEvents(
  accessToken: string,
  refreshToken: string,
  events: Array<{
    title: string;
    date: string;
    startTime: string;
    endTime?: string;
    location?: string;
    description?: string;
  }>
): Promise<Array<{ eventId: string; title: string }>> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const createdEvents: Array<{ eventId: string; title: string }> = [];

  for (const event of events) {
    try {
      // Parse the date and times
      const startDateTime = new Date(`${event.date}T${event.startTime}:00`);
      let endDateTime: Date;
      
      if (event.endTime) {
        endDateTime = new Date(`${event.date}T${event.endTime}:00`);
      } else {
        // Default to 1 hour if no end time specified
        endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      }

      const calendarEvent = {
        summary: event.title,
        description: event.description || '',
        location: event.location || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'UTC', // You might want to make this configurable
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'UTC',
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: calendarEvent,
      });

      if (response.data.id) {
        createdEvents.push({
          eventId: response.data.id,
          title: event.title,
        });
      }
    } catch (error) {
      console.error(`Failed to create event "${event.title}":`, error);
      // Continue with other events even if one fails
    }
  }

  return createdEvents;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }

  return credentials.access_token;
}
