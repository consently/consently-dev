'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';

interface ImplementationNotesProps {
  checklist: string[];
  importantNotes: string[];
}

export function ImplementationNotes({ checklist, importantNotes }: ImplementationNotesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Implementation Checklist
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {checklist.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Important Notes
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {importantNotes.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      </div>
    </div>
  );
}
