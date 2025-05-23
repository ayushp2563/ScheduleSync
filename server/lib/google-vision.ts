import { ImageAnnotatorClient } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!visionClient) {
    // Initialize with service account key from environment
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS ? 
      JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) : 
      undefined;
    
    visionClient = new ImageAnnotatorClient({
      credentials,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
  }
  return visionClient;
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  try {
    const client = getVisionClient();
    
    const [result] = await client.textDetection({
      image: {
        content: imageBuffer,
      },
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in the image');
    }

    // The first annotation contains the full text
    const fullText = detections[0].description || '';
    
    if (!fullText.trim()) {
      throw new Error('No readable text found in the image');
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}
