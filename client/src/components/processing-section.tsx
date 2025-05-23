import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Settings } from "lucide-react";

interface ProcessingSectionProps {
  isVisible: boolean;
}

export function ProcessingSection({ isVisible }: ProcessingSectionProps) {
  if (!isVisible) return null;

  return (
    <Card className="bg-white shadow-sm border border-neutral-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center">
          <Settings className="text-google-blue mr-2 w-5 h-5 animate-spin" />
          Processing Your Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Extracting text from image...</span>
            <div className="w-24">
              <Progress value={75} className="h-2" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Parsing schedule information...</span>
            <div className="w-24">
              <Progress value={50} className="h-2" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">Creating calendar events...</span>
            <div className="w-24">
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
          <strong>Processing:</strong> Using OCR to extract text, then AI to identify dates, times, and event details...
        </div>
      </CardContent>
    </Card>
  );
}
