import React, { useState } from 'react';
import { AnalysisResult } from '../services/gemini';
import { History, Calendar, ChevronRight, FileText, Search } from 'lucide-react';

interface ExamHistoryItem {
  id: string;
  fileName: string;
  subject: string;
  uploadDate: any;
  result: AnalysisResult;
}

interface ExamHistoryProps {
  history: ExamHistoryItem[];
  onSelect: (item: ExamHistoryItem) => void;
}

export function ExamHistory({ history, onSelect }: ExamHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (history.length === 0) return null;

  const filteredHistory = history.filter(item => 
    item.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-500" />
          <h3 className="font-bold text-zinc-900">Recent Analyses</h3>
        </div>
        
        <div className="relative group w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <input
            type="text"
            placeholder="Search by subject or file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex items-center gap-4 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-900 transition-all group text-left shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
                <FileText className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 truncate">{item.subject}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.uploadDate?.seconds * 1000).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="truncate">{item.fileName}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
            </button>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p>No matches found for "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
