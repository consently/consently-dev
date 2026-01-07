'use client';

import React from 'react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

interface ComparisonTableProps {
  data: {
    feature: string;
    consciously: React.ReactNode | string;
    cookieYes?: React.ReactNode | string;
    oneTrust?: React.ReactNode | string;
  }[];
  bestChoiceColumn?: 'consciously' | 'cookieYes' | 'oneTrust';
}

export function ComparisonTable({ data, bestChoiceColumn = 'consciously' }: ComparisonTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Mobile card layout
    return (
      <div className="space-y-4">
        {data.map((row, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <h3 className="font-semibold text-base">{row.feature}</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                bestChoiceColumn === 'consciously' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Consently</span>
                  {bestChoiceColumn === 'consciously' && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">BEST</span>
                  )}
                </div>
                <div className="text-right">{row.consciously}</div>
              </div>
              
              {row.cookieYes && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  bestChoiceColumn === 'cookieYes' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">CookieYes</span>
                    {bestChoiceColumn === 'cookieYes' && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">BEST</span>
                    )}
                  </div>
                  <div className="text-right">{row.cookieYes}</div>
                </div>
              )}
              
              {row.oneTrust && (
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  bestChoiceColumn === 'oneTrust' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">OneTrust</span>
                    {bestChoiceColumn === 'oneTrust' && (
                      <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">BEST</span>
                    )}
                  </div>
                  <div className="text-right">{row.oneTrust}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-2xl shadow-xl overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <th className="py-4 px-6 text-left font-bold text-base sm:text-lg">Feature</th>
            <th className="py-4 px-6 text-center font-bold text-base sm:text-lg bg-gradient-to-r from-blue-700 to-purple-700">
              <div className="flex flex-col items-center">
                <span>Consently</span>
                {bestChoiceColumn === 'consciously' && (
                  <span className="mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full border-0">BEST</span>
                )}
              </div>
            </th>
            {data.some(row => row.cookieYes) && (
              <th className="py-4 px-6 text-center font-bold text-base sm:text-lg">
                <div className="flex flex-col items-center">
                  <span>CookieYes</span>
                  {bestChoiceColumn === 'cookieYes' && (
                    <span className="mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full border-0">BEST</span>
                  )}
                </div>
              </th>
            )}
            {data.some(row => row.oneTrust) && (
              <th className="py-4 px-6 text-center font-bold text-base sm:text-lg">
                <div className="flex flex-col items-center">
                  <span>OneTrust</span>
                  {bestChoiceColumn === 'oneTrust' && (
                    <span className="mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full border-0">BEST</span>
                  )}
                </div>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-blue-50 transition-colors">
              <td className="py-4 px-6 font-semibold text-gray-900">{row.feature}</td>
              <td className={`py-4 px-6 text-center ${
                bestChoiceColumn === 'consciously' ? 'bg-blue-50' : ''
              }`}>
                {row.consciously}
              </td>
              {row.cookieYes && (
                <td className={`py-4 px-6 text-center ${
                  bestChoiceColumn === 'cookieYes' ? 'bg-blue-50' : ''
                }`}>
                  {row.cookieYes}
                </td>
              )}
              {row.oneTrust && (
                <td className={`py-4 px-6 text-center ${
                  bestChoiceColumn === 'oneTrust' ? 'bg-blue-50' : ''
                }`}>
                  {row.oneTrust}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
