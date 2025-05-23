import { apiRequest } from "./queryClient";
import type { ExtractedEvent, UpdateExtractedEvent } from "@shared/schema";

export async function uploadScheduleImage(file: File): Promise<{ scheduleImageId: number }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload-schedule', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to upload image');
  }

  return response.json();
}

export async function getScheduleStatus(scheduleId: number) {
  const response = await apiRequest('GET', `/api/schedule/${scheduleId}`);
  return response.json();
}

export async function updateEvent(eventId: number, updates: UpdateExtractedEvent): Promise<ExtractedEvent> {
  const response = await apiRequest('PATCH', `/api/events/${eventId}`, updates);
  return response.json();
}

export async function deleteEvent(eventId: number): Promise<void> {
  await apiRequest('DELETE', `/api/events/${eventId}`);
}

export async function createCalendarEvents(eventIds: number[]): Promise<{ createdEvents: Array<{ eventId: string; title: string }> }> {
  const response = await apiRequest('POST', '/api/create-calendar-events', { eventIds });
  return response.json();
}

export async function getGoogleAuthUrl(): Promise<{ authUrl: string }> {
  const response = await apiRequest('GET', '/api/auth/google');
  return response.json();
}

export async function getAuthStatus(): Promise<{ isConnected: boolean }> {
  const response = await apiRequest('GET', '/api/auth/status');
  return response.json();
}
