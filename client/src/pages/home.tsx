import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UploadSection } from "@/components/upload-section";
import { ProcessingSection } from "@/components/processing-section";
import { ResultsSection } from "@/components/results-section";
import { Card, CardContent } from "@/components/ui/card";
import { getScheduleStatus } from "@/lib/api";
import { Eye, Brain, RotateCcw } from "lucide-react";

export default function Home() {
  const [currentScheduleId, setCurrentScheduleId] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for schedule status when processing
  const { data: scheduleData, refetch } = useQuery({
    queryKey: ['/api/schedule', currentScheduleId],
    queryFn: () => getScheduleStatus(currentScheduleId!),
    enabled: !!currentScheduleId,
    refetchInterval: isPolling ? 2000 : false,
  });

  // Handle polling based on processing status
  useEffect(() => {
    if (scheduleData?.schedule) {
      const status = scheduleData.schedule.processingStatus;
      setIsPolling(status === 'processing' || status === 'uploading');
      
      if (status === 'completed' || status === 'failed') {
        setIsPolling(false);
      }
    }
  }, [scheduleData]);

  const handleUploadSuccess = (scheduleId: number) => {
    setCurrentScheduleId(scheduleId);
    setIsPolling(true);
  };

  const isProcessing = scheduleData?.schedule?.processingStatus === 'processing' || 
                     scheduleData?.schedule?.processingStatus === 'uploading';

  const showResults = scheduleData?.schedule && 
                     (scheduleData.schedule.processingStatus === 'completed' || 
                      scheduleData.schedule.processingStatus === 'failed');

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">
            Transform Schedule Images into Calendar Events
          </h2>
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
            Upload a screenshot of your schedule, and our AI will automatically extract events and add them to your Google Calendar. 
            Perfect for class schedules, meeting agendas, and event programs.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-neutral-600">
            <div className="flex items-center space-x-2">
              <Eye className="text-google-blue w-4 h-4" />
              <span>OCR Text Extraction</span>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="text-google-green w-4 h-4" />
              <span>AI Schedule Parsing</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-google-red" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google Calendar Sync</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <UploadSection onUploadSuccess={handleUploadSuccess} />
            <ProcessingSection isVisible={isProcessing} />
          </div>

          <div className="space-y-6">
            {showResults ? (
              <ResultsSection 
                events={scheduleData.events || []}
                scheduleId={currentScheduleId!}
                processingStatus={scheduleData.schedule.processingStatus}
              />
            ) : (
              <Card className="bg-white shadow-sm border border-neutral-200">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <RotateCcw className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">Ready to Process</h3>
                    <p className="text-neutral-600">
                      Upload a schedule image to get started. Extracted events will appear here for review.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Eye className="text-google-blue w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Smart OCR Recognition</h3>
            <p className="text-neutral-600 text-sm">
              Advanced optical character recognition that handles various image qualities and formats with high accuracy.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="text-google-green w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">AI-Powered Parsing</h3>
            <p className="text-neutral-600 text-sm">
              Intelligent parsing that understands context, handles multiple date formats, and extracts complete event details.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="text-google-red w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Seamless Integration</h3>
            <p className="text-neutral-600 text-sm">
              Direct integration with Google Calendar using secure OAuth2 authentication for instant event creation.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
