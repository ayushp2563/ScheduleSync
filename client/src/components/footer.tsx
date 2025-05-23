import { Calendar } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-google-blue rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-3 h-3" />
            </div>
            <span className="text-neutral-600 text-sm">ScheduleSync - Smart Calendar Automation</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-neutral-500">
            <a href="#" className="hover:text-neutral-700 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-neutral-700 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-700 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
