import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthStatus, getGoogleAuthUrl } from "@/lib/api";
import { Calendar, HelpCircle } from "lucide-react";

export function Header() {
  const queryClient = useQueryClient();
  
  const { data: authStatus } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: () => getAuthStatus(),
  });

  const connectGoogleMutation = useMutation({
    mutationFn: async () => {
      const { authUrl } = await getGoogleAuthUrl();
      window.location.href = authUrl;
    },
  });

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-google-blue rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">ScheduleSync</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-neutral-900"
              onClick={() => {
                alert('Help: Upload a schedule image and our AI will extract events to add to your Google Calendar!');
              }}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => connectGoogleMutation.mutate()}
              disabled={connectGoogleMutation.isPending || authStatus?.isConnected}
              className="bg-google-blue text-white hover:bg-blue-600 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{authStatus?.isConnected ? 'Connected' : 'Connect Google'}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
