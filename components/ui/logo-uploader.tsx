'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

type LogoUploaderProps = {
  value?: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
};

export function LogoUploader({ 
  value = '', 
  onChange, 
  maxSizeMB = 2,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
}: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Please upload: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const fileExtension = file.name.split('.').pop();
      const filename = `${user.id}/${timestamp}_${randomString}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filename);

      console.log('File uploaded successfully:', publicUrl);
      onChange(publicUrl);
      setError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInputValue.trim()) {
      // Basic URL validation
      try {
        new URL(urlInputValue);
        onChange(urlInputValue.trim());
        setUrlInputValue('');
        setShowUrlInput(false);
        setError(null);
      } catch {
        setError('Please enter a valid URL (e.g., https://example.com/logo.png)');
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Preview */}
      {value && (
        <div className="relative inline-block">
          <div className="border-2 border-gray-200 rounded-lg p-3 bg-white">
            <img 
              src={value} 
              alt="Logo" 
              className="h-16 w-auto max-w-[200px] object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setError('Failed to load logo image');
              }}
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
            title="Remove logo"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!value && (
        <div>
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Uploading logo...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900 mb-1">
                    Drag and drop your logo here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mt-2"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <div className="text-xs text-gray-500 mt-2">
                  PNG, JPG, SVG, WebP (max {maxSizeMB}MB)
                </div>
              </div>
            )}
          </div>

          {/* URL Input Alternative */}
          <div className="mt-4">
            {!showUrlInput ? (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <LinkIcon className="h-4 w-4" />
                Or enter logo URL
              </button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlSubmit();
                    }
                  }}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  variant="outline"
                  disabled={!urlInputValue.trim()}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInputValue('');
                    setError(null);
                  }}
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Recommended size: 120x40px (or similar aspect ratio)</p>
        <p>• Transparent backgrounds work best (PNG or SVG)</p>
        <p>• Logo will be displayed in the cookie banner header</p>
      </div>
    </div>
  );
}
