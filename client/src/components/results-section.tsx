import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarCheck, Edit, Trash2, Plus, CheckSquare, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent, deleteEvent, createCalendarEvents } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ExtractedEvent } from "@shared/schema";

interface ResultsSectionProps {
  events: ExtractedEvent[];
  scheduleId: number;
  processingStatus: string;
}

export function ResultsSection({ events, scheduleId, processingStatus }: ResultsSectionProps) {
  const [editingEvents, setEditingEvents] = useState<Record<number, boolean>>({});
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ eventId, updates }: { eventId: number; updates: any }) => 
      updateEvent(eventId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule', scheduleId] });
      toast({ title: "Event updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule', scheduleId] });
      toast({ title: "Event deleted successfully" });
    },
  });

  const createCalendarMutation = useMutation({
    mutationFn: createCalendarEvents,
    onSuccess: (result) => {
      setShowSuccess(true);
      setSelectedEvents(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/schedule', scheduleId] });
      toast({ 
        title: "Events created successfully", 
        description: `${result.createdEvents.length} events added to your calendar`
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setShowError(true);
    },
  });

  const handleEventUpdate = (eventId: number, field: string, value: string) => {
    updateMutation.mutate({
      eventId,
      updates: { [field]: value },
    });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(eventId);
    }
  };

  const toggleEventSelection = (eventId: number) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const selectAllEvents = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map(e => e.id)));
    }
  };

  const handleCreateCalendarEvents = () => {
    if (selectedEvents.size === 0) {
      toast({ title: "Please select events to add to calendar", variant: "destructive" });
      return;
    }
    createCalendarMutation.mutate(Array.from(selectedEvents));
  };

  if (processingStatus === 'failed') {
    return (
      <Card className="bg-white shadow-sm border border-neutral-200">
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <h3 className="font-semibold mb-2">Processing Failed</h3>
              <p className="mb-4">
                We couldn't extract schedule information from your image. This might be due to poor image quality, 
                unclear text, or an unsupported format.
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">Try these tips:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Ensure the image is clear and text is readable</li>
                  <li>• Use good lighting when taking screenshots</li>
                  <li>• Make sure dates and times are clearly visible</li>
                  <li>• Avoid handwritten schedules when possible</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0 && processingStatus === 'completed') {
    return (
      <Card className="bg-white shadow-sm border border-neutral-200">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <CalendarCheck className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Events Found</h3>
            <p className="text-neutral-600">
              We couldn't find any schedule events in your image. Please try uploading a different image with clearer text.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-neutral-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center">
              <CalendarCheck className="text-google-green mr-2 w-5 h-5" />
              Extracted Events
            </CardTitle>
            <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
              {events.length} events found
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border border-neutral-200 rounded-lg p-4 hover:border-google-blue transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={() => toggleEventSelection(event.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Input
                          value={event.title}
                          onChange={(e) => handleEventUpdate(event.id, 'title', e.target.value)}
                          className="font-medium text-neutral-900 border-none p-0 h-auto focus:ring-0 bg-transparent"
                        />
                        <Edit className="text-neutral-400 w-3 h-3" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-500">Date:</span>
                          <Input
                            type="date"
                            value={event.date}
                            onChange={(e) => handleEventUpdate(event.id, 'date', e.target.value)}
                            className="ml-2 text-neutral-700 border-none p-0 h-auto focus:ring-0 bg-transparent inline-block w-auto"
                          />
                        </div>
                        <div>
                          <span className="text-neutral-500">Time:</span>
                          <Input
                            type="time"
                            value={event.startTime}
                            onChange={(e) => handleEventUpdate(event.id, 'startTime', e.target.value)}
                            className="ml-2 text-neutral-700 border-none p-0 h-auto focus:ring-0 bg-transparent inline-block w-auto"
                          />
                          <span className="mx-1">-</span>
                          <Input
                            type="time"
                            value={event.endTime || ''}
                            onChange={(e) => handleEventUpdate(event.id, 'endTime', e.target.value)}
                            className="text-neutral-700 border-none p-0 h-auto focus:ring-0 bg-transparent inline-block w-auto"
                          />
                        </div>
                      </div>
                      {(event.location || editingEvents[event.id]) && (
                        <div className="mt-2 text-sm">
                          <span className="text-neutral-500">Location:</span>
                          <Input
                            value={event.location || ''}
                            onChange={(e) => handleEventUpdate(event.id, 'location', e.target.value)}
                            placeholder="Add location..."
                            className="ml-2 text-neutral-700 border-none p-0 h-auto focus:ring-0 bg-transparent inline-block flex-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-4 h-4 bg-google-green rounded-full flex items-center justify-center">
                      <CheckCircle className="text-white w-3 h-3" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-neutral-400 hover:text-google-red h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllEvents}
                className="text-neutral-600 hover:text-neutral-900 flex items-center space-x-1"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{selectedEvents.size === events.length ? 'Deselect All' : 'Select All'}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedEvents(new Set());
                  setShowSuccess(false);
                  setShowError(false);
                }}
              >
                Reset
              </Button>
              <Button
                onClick={handleCreateCalendarEvents}
                disabled={createCalendarMutation.isPending || selectedEvents.size === 0}
                className="bg-google-blue hover:bg-blue-600 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Add to Calendar ({selectedEvents.size})</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Section */}
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Events Added Successfully!</h3>
                <p className="text-green-700 text-sm mb-4">
                  {selectedEvents.size} events have been added to your Google Calendar. 
                  You can view them in your calendar app or make changes directly there.
                </p>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="link"
                    className="text-google-blue hover:underline flex items-center space-x-1 p-0 h-auto"
                    onClick={() => window.open('https://calendar.google.com', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View in Google Calendar</span>
                  </Button>
                  <Button
                    variant="link"
                    className="text-neutral-600 hover:text-neutral-900 p-0 h-auto"
                    onClick={() => window.location.reload()}
                  >
                    Process Another Schedule
                  </Button>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Section */}
      {showError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Failed to Create Events</h3>
                <p className="text-red-700 text-sm mb-4">
                  {errorMessage || 'An error occurred while creating calendar events. Please try again.'}
                </p>
                <Button
                  variant="link"
                  className="text-google-blue hover:underline p-0 h-auto"
                  onClick={() => setShowError(false)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
