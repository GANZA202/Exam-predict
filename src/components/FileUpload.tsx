import React, { useCallback, useState } from 'react';
import { Upload, File, X, Loader2, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isAnalyzing: boolean;
  isOnline: boolean;
}

export function FileUpload({ onFilesSelect, isAnalyzing, isOnline }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ease-in-out flex flex-col items-center justify-center gap-4",
          isDragging ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 bg-white",
          isAnalyzing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.txt"
          multiple
          disabled={isAnalyzing}
        />
        
        <div className="p-4 bg-zinc-100 rounded-full">
          {isAnalyzing ? (
            <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-zinc-900" />
          )}
        </div>
        
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-900">
            {isAnalyzing ? "Analyzing Papers..." : "Upload Exam Papers"}
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Drag and drop or click to browse (PDF, Image, Text)
          </p>
        </div>
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg shadow-sm"
                >
                  <File className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {file.name}
                  </span>
                  {!isAnalyzing && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="hover:text-zinc-300 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !isOnline}
                className={cn(
                  "flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:scale-100",
                  (isAnalyzing || !isOnline) && "cursor-not-allowed"
                )}
              >
                {!isOnline ? (
                  <>
                    <WifiOff className="w-5 h-5" />
                    Offline (Connect to Analyze)
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze {selectedFiles.length} Paper{selectedFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
