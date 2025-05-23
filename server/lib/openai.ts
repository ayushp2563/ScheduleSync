import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function parseScheduleText(extractedText: string, imageBase64?: string): Promise<{
  events: Array<{
    title: string;
    date: string;
    startTime: string;
    endTime?: string;
    location?: string;
    description?: string;
  }>;
  confidence: number;
  originalText: string;
}> {
  try {
    const systemPrompt = `You are an expert at parsing schedule information from text extracted via OCR. Your task is to identify individual events/appointments and extract structured information about each one.

Extract the following information for each event:
- title: The name/subject of the event
- date: Date in YYYY-MM-DD format
- startTime: Start time in HH:MM format (24-hour)
- endTime: End time in HH:MM format (24-hour) if available
- location: Location/room if mentioned
- description: Any additional details

Handle various date formats like:
- MM/DD/YYYY, DD/MM/YYYY
- "Monday", "Tuesday", etc. (assume current week)
- "Jan 15", "January 15th", etc.
- Relative dates like "Tomorrow", "Next Monday"

Handle various time formats like:
- 12-hour (9:00 AM, 2:30 PM)
- 24-hour (09:00, 14:30)
- Time ranges (9:00-10:30, 2-4 PM)

If information is missing or unclear, make reasonable assumptions based on context. If no clear date is found, use today's date. If no end time is specified but duration seems implied, estimate a reasonable duration.

Respond ONLY with valid JSON in this exact format:
{
  "events": [
    {
      "title": "Event Title",
      "date": "2024-01-15",
      "startTime": "09:00",
      "endTime": "10:30",
      "location": "Room 101",
      "description": "Additional details"
    }
  ],
  "confidence": 0.85,
  "originalText": "The full extracted text"
}`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please parse this schedule text and extract all events:\n\n${extractedText}` }
    ];

    // If we have the original image, include it for better context
    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Here is the original image for additional context:"
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate the response structure
    if (!result.events || !Array.isArray(result.events)) {
      throw new Error('Invalid response format from AI parsing');
    }

    // Ensure each event has required fields
    const validatedEvents = result.events.map((event: any) => {
      if (!event.title || !event.date || !event.startTime) {
        throw new Error('Missing required event fields');
      }
      return {
        title: String(event.title).trim(),
        date: String(event.date).trim(),
        startTime: String(event.startTime).trim(),
        endTime: event.endTime ? String(event.endTime).trim() : undefined,
        location: event.location ? String(event.location).trim() : undefined,
        description: event.description ? String(event.description).trim() : undefined,
      };
    });

    return {
      events: validatedEvents,
      confidence: Math.min(1, Math.max(0, Number(result.confidence) || 0.5)),
      originalText: extractedText,
    };
  } catch (error) {
    console.error('Error parsing schedule with AI:', error);
    throw new Error(`AI parsing failed: ${error.message}`);
  }
}
