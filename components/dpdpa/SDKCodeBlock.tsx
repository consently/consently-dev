'use client';

import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, AlertCircle, FileCode } from 'lucide-react';

interface SDKCodeBlockProps {
  title: string;
  icon: React.ReactNode;
  code: string;
  copied: string;
  onCopy: (text: string, label: string) => void;
  alertContent?: string;
  endpointBoxes?: React.ReactNode;
}

export function SDKCodeBlock({
  title,
  icon,
  code,
  copied,
  onCopy,
  alertContent,
  endpointBoxes
}: SDKCodeBlockProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopy(code, `${title} code`)}
        >
          {copied === `${title} code` ? (
            <CheckCircle className="h-4 w-4 mr-1" />
          ) : (
            <Copy className="h-4 w-4 mr-1" />
          )}
          Copy
        </Button>
      </div>

      {alertContent && (
        <div className="text-xs text-gray-600 mb-3 p-2 bg-amber-50 rounded border border-amber-200">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          {alertContent}
        </div>
      )}

      {endpointBoxes && endpointBoxes}

      <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-96">
        <code>{code}</code>
      </pre>
    </div>
  );
}
