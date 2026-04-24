import React, { useState } from 'react';
import { AnalysisResult } from '../services/gemini';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Brain, Target, Repeat, AlertCircle, CheckCircle2, 
  FileText, BookOpen, ChevronRight, ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

export function AnalysisDashboard({ result }: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'exam' | 'notes'>('stats');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Subject Identified</h2>
          <p className="text-4xl font-black text-zinc-900 leading-none">{result.subject}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-bold text-zinc-400 uppercase">Analysis Precision</p>
            <p className="text-2xl font-black text-zinc-900">{(result.confidenceScore * 100).toFixed(0)}%</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-zinc-100 rounded-2xl w-fit">
        {[
          { id: 'stats', label: 'Analysis Insights', icon: Brain },
          { id: 'exam', label: 'Predicted Mock Exam', icon: FileText },
          { id: 'notes', label: 'Study Notes', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all
              ${activeTab === tab.id 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-900'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div 
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Topic Frequency Chart */}
              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <Target className="w-5 h-5 text-zinc-900" />
                  <h3 className="font-black text-xl text-zinc-900">Topic Frequency</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.topics} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f4f4f5" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8f8f8' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="frequency" fill="#18181b" radius={[0, 8, 8, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Predicted Topics */}
              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <Brain className="w-5 h-5 text-zinc-900" />
                  <h3 className="font-black text-xl text-zinc-900">Topic Predictions</h3>
                </div>
                <div className="space-y-4">
                  {result.predictions.map((pred, idx) => (
                    <motion.div 
                      key={idx}
                      className="p-5 rounded-2xl border border-zinc-100 bg-zinc-50/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-zinc-900 text-lg">{pred.topic}</span>
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-zinc-200 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-black text-zinc-900">
                            {(pred.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 leading-relaxed font-medium">{pred.reasoning}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Repeated Questions & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                  <Repeat className="w-5 h-5 text-zinc-900" />
                  <h3 className="font-black text-xl text-zinc-900">Patterns: Repeated Questions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.repeatedQuestions.length > 0 ? (
                    result.repeatedQuestions.map((q, idx) => (
                      <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-zinc-300 transition-all">
                        <span className="text-zinc-300 font-black text-3xl leading-none">{idx + 1}</span>
                        <p className="text-sm text-zinc-700 font-medium italic">"{q}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 text-zinc-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="font-bold">No structural overlaps detected.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <h3 className="font-black text-xl text-zinc-900 mb-8">Distribution</h3>
                <div className="h-[200px] w-full scale-110">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={result.topics}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="frequency"
                      >
                        {result.topics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 space-y-3">
                  {result.topics.slice(0, 4).map((topic, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm text-zinc-900 font-bold">{topic.name}</span>
                      </div>
                      <span className="text-sm font-black text-zinc-400">{topic.frequency}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'exam' && (
          <motion.div 
            key="exam"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-8 sm:p-12 rounded-[40px] border border-zinc-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-zinc-900" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div className="space-y-2">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 w-fit px-3 py-1 rounded-full">Automated Generation</h3>
                <h4 className="text-4xl font-black text-zinc-900 uppercase leading-none mt-2">{result.mockExam.title}</h4>
              </div>
              <div className="text-right border-l-4 border-zinc-900 pl-6 h-fit hidden sm:block">
                <p className="text-xs font-bold text-zinc-400 uppercase">Examination Year</p>
                <p className="text-xl font-black text-zinc-900">2026 PREDICTION</p>
              </div>
            </div>

            <div className="space-y-12">
              {result.mockExam.sections.map((section, idx) => (
                <div key={idx} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h5 className="font-black text-xl text-white bg-zinc-900 px-4 py-1 rounded-xl">{section.title}</h5>
                    <div className="h-0.5 flex-1 bg-zinc-100" />
                  </div>
                  <div className="space-y-8 pl-4">
                    {section.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex gap-6 group">
                        <span className="font-black text-zinc-300 text-lg group-hover:text-zinc-900 transition-colors w-8">
                          Q{qIdx + 1}.
                        </span>
                        <p className="text-lg text-zinc-800 font-medium leading-relaxed flex-1">
                          {q}
                        </p>
                        <div className="w-12 h-px bg-zinc-100 mt-4 hidden sm:block" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-8 border-t border-dashed border-zinc-200 flex justify-between items-center text-xs text-zinc-400 font-bold uppercase tracking-widest">
              <span>ExamPredict System v2.0</span>
              <span>Proprietary Prediction Logic</span>
            </div>
          </motion.div>
        )}

        {activeTab === 'notes' && (
          <motion.div 
            key="notes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {result.studyNotes.map((note, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm relative group"
              >
                <div className="absolute top-4 right-4 w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 transition-colors">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-zinc-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-zinc-900 rounded-full" />
                  {note.topic}
                </h4>
                <ul className="space-y-4">
                  {note.keyPoints.map((point, pIdx) => (
                    <li key={pIdx} className="flex gap-4 items-start">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                      <p className="text-zinc-600 font-medium text-sm leading-relaxed">{point}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
