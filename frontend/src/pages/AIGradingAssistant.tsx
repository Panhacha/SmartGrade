import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Wand2, LayoutDashboard, Search, CheckCircle, XCircle, AlertTriangle, FileText, BrainCircuit, ScanSearch, Check, Trash2, Filter } from 'lucide-react';

export const AIGradingAssistant = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Mock data representing AI Grading Queue
  const [queueTasks] = useState([
    {
      id: 'TASK-88291',
      studentName: 'Sok San',
      studentId: 'STU1001',
      assessment: 'Mathematics Midterm',
      questionId: 'Q5 (Essay)',
      status: 'PENDING',
      confidence: null,
    },
    {
      id: 'TASK-88292',
      studentName: 'Channary Tep',
      studentId: 'STU1002',
      assessment: 'History Final',
      questionId: 'Q1 (Short Answer)',
      status: 'AI_GRADED',
      score: 4.5,
      maxScore: 5,
      confidence: 0.98,
    }
  ]);

  const [reviewTasks] = useState([
    {
      id: 'TASK-88295',
      studentName: 'Bopha Meas',
      studentId: 'STU1005',
      assessment: 'Mathematics Midterm',
      questionId: 'Q5 (Essay)',
      status: 'NEEDS_VERIFICATION',
      extractedText: "ចម្លើយ៖ X = 15 ព្រោះ 5x + 10 = 85 (Handwriting messy)",
      suggestedScore: 8,
      maxScore: 10,
      confidence: 0.65,
      feedback: 'ការគណនាត្រឹមត្រូវ ប៉ុន្តែការរៀបរាប់មិនសូវច្បាស់លាស់។ ទាមទារការពិនិត្យពីគ្រូ។',
      rubric: {
        keywords: ['15', '85', '5x'],
        instructions: 'សិស្សត្រូវបង្ហាញវិធីសាស្រ្តច្បាស់លាស់ទើបបានពិន្ទុពេញ។'
      },
      imageUrl: 'https://placehold.co/600x400/e2e8f0/475569?text=Handwritten+Equation'
    }
  ]);

  const [aiGenerator, setAiGenerator] = useState({
    subject: 'Mathematics',
    grade: 'Grade 10',
    topic: 'Quadratic Equations',
    mcqCount: 5,
    essayCount: 2,
    language: 'Khmer'
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center tracking-tight">
            <Wand2 className="w-8 h-8 mr-3 text-indigo-600" />
            AI Grading Assistant
          </h1>
          <p className="text-slate-500 mt-1">Smart AI engine for essay grading, OCR processing, and exam generation.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center">
            <BrainCircuit className="w-4 h-4 mr-2" /> Create AI Exam
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center shadow-md shadow-emerald-600/20">
            <ScanSearch className="w-4 h-4 mr-2" /> Batch Grade Scans
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <FileText className="w-4 h-4 mr-2" /> Pending Processing
        </button>
        <button 
          onClick={() => { setActiveTab('review'); setSelectedTask(reviewTasks[0]); }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center relative ${activeTab === 'review' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <AlertTriangle className="w-4 h-4 mr-2" /> Requires Review
          <span className="absolute top-2 right-4 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">{reviewTasks.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('generator')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${activeTab === 'generator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <BrainCircuit className="w-4 h-4 mr-2" /> AI Exam & Rubric Generator
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* Pending Queue Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Auto Grading Queue
              </h3>
              <div className="flex space-x-2">
                <button className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-indigo-600 transition-colors"><Filter className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-6 py-4 font-bold border-b border-slate-200">Task ID</th>
                    <th className="px-6 py-4 font-bold border-b border-slate-200">Student</th>
                    <th className="px-6 py-4 font-bold border-b border-slate-200">Assessment / Target</th>
                    <th className="px-6 py-4 font-bold border-b border-slate-200">Status</th>
                    <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{task.id}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{task.studentName}</p>
                        <p className="text-xs text-slate-500">{task.studentId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{task.assessment}</p>
                        <p className="text-xs text-slate-500">{task.questionId}</p>
                      </td>
                      <td className="px-6 py-4">
                        {task.status === 'PENDING' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Waiting for AI...
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 mr-1" /> Graded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {task.confidence ? (
                          <span className={`text-sm font-bold ${task.confidence > 0.9 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {(task.confidence * 100).toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Split Viewer Tab */}
        {activeTab === 'review' && selectedTask && (
          <div className="flex-1 flex space-x-6 overflow-hidden">
            
            {/* Left Panel: Scanned Image */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">Scanned Answer Box</h3>
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-1 rounded">{selectedTask.id}</span>
              </div>
              <div className="flex-1 p-6 bg-slate-100 flex items-center justify-center relative">
                <img src={selectedTask.imageUrl} alt="Scanned Answer" className="max-w-full h-auto rounded-lg shadow-md border border-slate-300" />
                {/* Simulated Bounding Box Overlay */}
                <div className="absolute top-[40%] left-[20%] w-[60%] h-[30%] border-2 border-amber-500 bg-amber-500/10 rounded pointer-events-none"></div>
              </div>
            </div>

            {/* Middle Panel: OCR vs Rubric */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-700 text-sm">OCR & Expected Rubric</h3>
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Extracted OCR Text</h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-['Khmer_OS_Siemreap','Inter',sans-serif] text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTask.extractedText}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teacher Rubric Criteria</h4>
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                    <p className="text-xs text-indigo-900 font-medium font-['Khmer_OS_Siemreap','Inter',sans-serif]">{selectedTask.rubric.instructions}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.rubric.keywords.map((kw: string, i: number) => (
                        <span key={i} className="bg-white border border-indigo-200 text-indigo-700 text-xs px-2 py-1 rounded shadow-sm">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: AI Scoring & Action */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-amber-50 flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="font-bold text-amber-900 text-sm">AI Score Needs Verification</h3>
              </div>
              <div className="flex-1 p-5 overflow-y-auto space-y-6">
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">AI Confidence</p>
                    <p className="text-lg font-black text-amber-500">{(selectedTask.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase">Suggested Score</p>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-black text-slate-800">{selectedTask.suggestedScore}</span>
                      <span className="text-sm font-bold text-slate-400 ml-1">/ {selectedTask.maxScore}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Feedback (Student Facing)</h4>
                  <textarea 
                    defaultValue={selectedTask.feedback}
                    className="w-full h-24 p-3 rounded-xl border border-slate-300 text-sm font-['Khmer_OS_Siemreap','Inter',sans-serif] outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adjust Final Score</h4>
                  <input type="range" min="0" max={selectedTask.maxScore} step="0.5" defaultValue={selectedTask.suggestedScore} className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-xs font-bold text-slate-400 mt-1">
                    <span>0</span>
                    <span>{selectedTask.maxScore}</span>
                  </div>
                </div>

              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3">
                <button className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors">
                  Reject & Retake
                </button>
                <button className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">
                  Approve Score
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Generator Tab */}
        {activeTab === 'generator' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex">
            <div className="w-1/2 p-8 border-r border-slate-100 overflow-y-auto">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center">
                <BrainCircuit className="w-6 h-6 mr-3 text-indigo-600" />
                Prompt Exam Generator
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Subject / Field</label>
                  <input type="text" value={aiGenerator.subject} onChange={e => setAiGenerator({...aiGenerator, subject: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Grade Level</label>
                    <input type="text" value={aiGenerator.grade} onChange={e => setAiGenerator({...aiGenerator, grade: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Output Language</label>
                    <select value={aiGenerator.language} onChange={e => setAiGenerator({...aiGenerator, language: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Khmer">Khmer</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Specific Topic</label>
                  <textarea value={aiGenerator.topic} onChange={e => setAiGenerator({...aiGenerator, topic: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none" placeholder="Enter specific topics, e.g., Solving quadratic equations using factoring..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">MCQ Questions</label>
                    <input type="number" value={aiGenerator.mcqCount} onChange={e => setAiGenerator({...aiGenerator, mcqCount: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Essay Questions</label>
                    <input type="number" value={aiGenerator.essayCount} onChange={e => setAiGenerator({...aiGenerator, essayCount: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center shadow-xl shadow-slate-900/20 mt-4">
                  <Wand2 className="w-5 h-5 mr-2 text-indigo-400" /> Generate Questions & Rubrics
                </button>
              </div>
            </div>
            
            <div className="w-1/2 bg-slate-50 flex items-center justify-center p-8">
              <div className="text-center text-slate-400">
                <BrainCircuit className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">AI Output Preview</p>
                <p className="text-sm mt-2 max-w-sm mx-auto">Fill out the prompt form and click Generate to see the AI-generated exam and grading rubrics here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
