import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CloudUpload, X } from "lucide-react";
import { uploadScheduleImage } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

interface UploadSectionProps {
  onUploadSuccess: (scheduleId: number) => void;
}

export function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadScheduleImage,
    onSuccess: (result) => {
      onUploadSuccess(result.scheduleImageId);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only PNG, JPG, JPEG, and WebP are allowed.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 flex items-center">
            <Upload className="text-google-blue mr-2 w-5 h-5" />
            Upload Schedule Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragOver 
                ? 'border-google-blue bg-blue-50' 
                : 'border-neutral-300 hover:border-google-blue hover:bg-blue-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                <CloudUpload className="text-2xl text-neutral-400 w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-medium text-neutral-700">Drop your schedule image here</p>
                <p className="text-sm text-neutral-500">or click to browse files</p>
              </div>
              <div className="text-xs text-neutral-400">
                Supports PNG, JPG, JPEG, WebP up to 10MB
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleFileSelect(files[0]);
                }
              }}
            />
          </div>

          {selectedFile && previewUrl && (
            <div className="mt-4">
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-700">Preview</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-neutral-400 hover:text-neutral-600 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <img 
                  src={previewUrl}
                  alt="Schedule preview" 
                  className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                />
                <div className="mt-2 text-xs text-neutral-500">
                  {selectedFile.name} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="mt-3 w-full bg-google-blue hover:bg-blue-600"
                >
                  {uploadMutation.isPending ? 'Processing...' : 'Process Schedule'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center">
            <div className="w-5 h-5 bg-google-yellow rounded mr-2 flex items-center justify-center">
              <span className="text-xs">💡</span>
            </div>
            Example Schedule Formats
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium text-neutral-700">Supported Formats:</div>
              <ul className="space-y-1 text-neutral-600">
                <li>• Class schedules</li>
                <li>• Meeting agendas</li>
                <li>• Event programs</li>
                <li>• Appointment lists</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-neutral-700">Date/Time Formats:</div>
              <ul className="space-y-1 text-neutral-600">
                <li>• MM/DD/YYYY</li>
                <li>• Monday, Jan 15</li>
                <li>• 9:00 AM - 10:30 AM</li>
                <li>• 14:00-15:30</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
