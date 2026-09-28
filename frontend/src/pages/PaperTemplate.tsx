import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Printer, Settings, Layout, Download, CheckCircle, Users, Shield, Grid, Type, Lock, Activity, Link as LinkIcon, FileText, Plus, GripVertical, Bold, Italic, Underline, Image as ImageIcon, Calculator, Trash2, Shuffle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Types for the Smart Worksheet Builder
type QuestionType = 'omr' | 'short_answer' | 'graph_box';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  optionsCount: number; // For OMR (2-5)
  correctAnswer: string; // For OMR
  lines: number; // For short_answer
  boxHeight: string; // For graph_box
  points: number;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export const PaperTemplate = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  
  // Base Config
  const [config, setConfig] = useState({
    schoolName: 'SMART ACADEMY',
    subject: 'Midterm Examination',
    instructions: 'សូមអានសំណួរនីមួយៗឱ្យបានច្បាស់លាស់មុននឹងឆ្លើយ។',
    examDate: new Date().toISOString().split('T')[0],
    examVersion: 'A',
    printMode: 'blank', // blank, batch
    watermark: '',
    idMethod: 'bubble', // written, bubble
    layoutUp: 1, // 1, 2
  });

  // Smart Builder State
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'sec-1',
      title: 'PART I: MULTIPLE CHOICE',
      questions: [
        { id: 'q1', type: 'omr', text: 'តើរាជធានីនៃប្រទេសកម្ពុជាមានឈ្មោះអ្វី?', optionsCount: 4, correctAnswer: 'A', lines: 0, boxHeight: '0', points: 10 },
        { id: 'q2', type: 'omr', text: 'If 2x + 5 = 15, what is the value of x?', optionsCount: 4, correctAnswer: 'C', lines: 0, boxHeight: '0', points: 10 },
      ]
    },
    {
      id: 'sec-2',
      title: 'PART II: WRITTEN & PROBLEM SOLVING',
      questions: [
        { id: 'q3', type: 'short_answer', text: 'ពន្យល់ពីវដ្តទឹកនៅក្នុងធម្មជាតិ។ (Explain the water cycle)', optionsCount: 0, correctAnswer: '', lines: 3, boxHeight: '0', points: 20 },
        { id: 'q4', type: 'graph_box', text: 'Draw the graph of the function f(x) = x^2 - 4x + 3.', optionsCount: 0, correctAnswer: '', lines: 0, boxHeight: 'h-32', points: 30 },
      ]
    }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, assessRes] = await Promise.all([
          axios.get('http://localhost:3000/students', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:3000/assessments', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setStudents(studentRes.data);
        setAssessments(assessRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handlePrint = () => window.print();

  // Builder Functions
  const addSection = () => {
    setSections([...sections, {
      id: `sec-${Date.now()}`,
      title: 'NEW SECTION',
      questions: []
    }]);
  };

  const addQuestion = (sectionId: string, type: QuestionType) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: [...sec.questions, {
            id: `q-${Date.now()}`,
            type,
            text: type === 'omr' ? 'New multiple choice question...' : type === 'short_answer' ? 'New short answer question...' : 'New drawing/graph question...',
            optionsCount: 4,
            correctAnswer: 'A',
            lines: 3,
            boxHeight: 'h-32',
            points: 10
          }]
        };
      }
      return sec;
    }));
  };

  const updateQuestion = (sectionId: string, qId: string, updates: Partial<Question>) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: sec.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
        };
      }
      return sec;
    }));
  };

  const deleteQuestion = (sectionId: string, qId: string) => {
    setSections(sections.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: sec.questions.filter(q => q.id !== qId)
        };
      }
      return sec;
    }));
  };

  const handleShuffle = () => {
    // Generate Variant by shuffling options and questions
    const shuffled = sections.map(sec => ({
      ...sec,
      questions: [...sec.questions].sort(() => Math.random() - 0.5)
    }));
    setSections(shuffled);
    setConfig({ ...config, examVersion: config.examVersion === 'A' ? 'B' : config.examVersion === 'B' ? 'C' : 'A' });
  };

  const totalScore = sections.reduce((sum, sec) => sum + sec.questions.reduce((qSum, q) => qSum + q.points, 0), 0);

  const generateSerialNumber = (studentCode: string) => {
    const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${config.examVersion}-${studentCode || 'BLANK'}-${hash}`;
  };

  const CornerMarks = () => (
    <>
      <div className="absolute top-6 left-6 w-10 h-10 border-[6px] border-black border-r-0 border-b-0 print:border-black" />
      <div className="absolute top-6 right-6 w-10 h-10 border-[6px] border-black border-l-0 border-b-0 print:border-black" />
      <div className="absolute bottom-6 left-6 w-10 h-10 border-[6px] border-black border-r-0 border-t-0 print:border-black" />
      <div className="absolute bottom-6 right-6 w-10 h-10 border-[6px] border-black border-l-0 border-t-0 print:border-black" />
    </>
  );

  const renderSinglePaper = (student?: any, isHalfPage: boolean = false) => {
    const serialNum = generateSerialNumber(student?.student_code);
    const scaleClass = isHalfPage ? 'scale-[0.68] origin-top-left' : '';
    const wrapperStyle = isHalfPage ? { width: '100%', height: '148mm' } : { width: '210mm', minHeight: '297mm' };
    
    let globalQIndex = 1;

    return (
      <div className={`bg-white relative shadow-2xl print:shadow-none print:m-0 print:border-none border border-slate-200 overflow-hidden font-['Khmer_OS_Siemreap','Inter',sans-serif] ${scaleClass}`} style={{ ...wrapperStyle, padding: `${isHalfPage ? '15mm' : '30mm'} 20mm 20mm 20mm` }}>
        <CornerMarks />
        
        {/* Watermark */}
        {config.watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.04] z-0 overflow-hidden">
            <h1 className="text-[120px] font-black uppercase rotate-[-45deg] whitespace-nowrap tracking-widest">{config.watermark}</h1>
          </div>
        )}

        {/* Calibration Box */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-0 z-10 border border-black">
          <div className="w-5 h-5 bg-black"></div>
          <div className="w-5 h-5 bg-gray-800"></div>
          <div className="w-5 h-5 bg-gray-600"></div>
          <div className="w-5 h-5 bg-gray-400"></div>
          <div className="w-5 h-5 bg-gray-200"></div>
        </div>
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4 relative z-10 mt-6">
          <div className="flex-1 pr-4">
            <h1 className="text-xl font-black uppercase tracking-widest mb-1 text-black font-['Hanuman','Moul',serif]">{config.schoolName}</h1>
            <h2 className="text-lg font-bold text-black mb-1">{config.subject}</h2>
            <div className="text-xs text-black mb-2 flex space-x-4">
              <span><strong>DATE:</strong> {config.examDate}</span>
              <span><strong>VERSION:</strong> SET {config.examVersion}</span>
            </div>
            <p className="text-[11px] text-black border border-black p-1.5 inline-block bg-slate-50"><strong>INSTRUCTIONS:</strong> {config.instructions}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="mb-1 p-2 border-[5px] border-black bg-white relative">
              <QRCodeSVG value={`SN:${serialNum}|SET:${config.examVersion}|ID:${student ? student.student_code : 'BLANK'}`} size={64} level="H" />
            </div>
            <p className="font-bold text-sm tracking-widest">SET {config.examVersion}</p>
          </div>
        </div>

        {/* Student ID Matrix Block */}
        <div className="flex space-x-4 mb-6 relative z-10">
          <div className="flex-1 border-2 border-black p-3 rounded-lg flex flex-col justify-end relative bg-white/50 backdrop-blur-sm">
            <span className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider">Student Name</span>
            {student ? (
              <p className="text-xl font-mono uppercase font-bold tracking-wider">{student.name}</p>
            ) : (
              <div className="border-b-2 border-black h-8 w-full mt-4"></div>
            )}
          </div>
          
          <div className="border-2 border-black p-3 rounded-lg relative min-w-[200px] bg-white/50 backdrop-blur-sm">
            <span className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-wider">Student ID Number</span>
            {config.idMethod === 'bubble' ? (
              <div className="mt-5 flex space-x-2 justify-center">
                {Array.from({ length: 5 }).map((_, digitIdx) => (
                  <div key={digitIdx} className="flex flex-col space-y-1 items-center">
                    <div className="w-5 h-5 border border-black text-center text-xs font-bold mb-1 bg-white">
                      {student ? student.student_code.charAt(digitIdx) || '' : ''}
                    </div>
                    {Array.from({ length: 10 }).map((_, num) => {
                      const isFilled = student && student.student_code.charAt(digitIdx) === num.toString();
                      return (
                        <div key={num} className={`w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[7px] ${isFilled ? 'bg-black text-white' : 'text-black bg-white'}`}>
                          {num}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col justify-end h-full">
                {student ? (
                  <p className="text-xl font-mono uppercase font-bold tracking-widest">{student.student_code}</p>
                ) : (
                  <div className="border-b-2 border-black h-8 w-full"></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Sections Content */}
        <div className="space-y-6 relative z-10">
          {sections.map((section, sIdx) => (
            <div key={section.id} className="mb-6">
              <h3 className="font-bold text-sm uppercase tracking-widest text-black border-b-2 border-black mb-4 pb-1">
                {section.title}
              </h3>
              
              <div className="space-y-5">
                {section.questions.map((q) => {
                  const qNum = globalQIndex++;
                  return (
                    <div key={q.id} className="relative">
                      {/* Question Text */}
                      <div className="flex items-start mb-2">
                        <span className="font-bold text-sm mr-2">{qNum}.</span>
                        <p className="text-sm text-black flex-1 leading-snug">{q.text}</p>
                        <span className="text-[10px] text-black border border-black px-1 ml-2 shrink-0">{q.points} pts</span>
                      </div>

                      {/* Question Body */}
                      <div className="pl-6">
                        {/* OMR Options */}
                        {q.type === 'omr' && (
                          <div className="flex space-x-6">
                            {['A', 'B', 'C', 'D', 'E'].slice(0, q.optionsCount).map((opt) => (
                              <div key={opt} className="flex items-center space-x-2">
                                <div className={`w-5 h-5 border-[1.5px] border-black rounded-full flex items-center justify-center text-[9px] font-bold bg-white text-black`}>
                                  {opt}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Short Answer Lines */}
                        {q.type === 'short_answer' && (
                          <div className="space-y-6 mt-4">
                            {Array.from({ length: q.lines }).map((_, lIdx) => (
                              <div key={lIdx} className="border-b border-black border-dotted w-full opacity-60"></div>
                            ))}
                          </div>
                        )}

                        {/* Graph/Drawing Box */}
                        {q.type === 'graph_box' && (
                          <div className={`w-full ${q.boxHeight} border-2 border-black border-dashed mt-2 bg-slate-50/30 flex items-center justify-center relative`}>
                            <Grid className="w-16 h-16 text-black opacity-10 absolute inset-0 w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Manual/AI Scoring Box for Non-OMR */}
                      {q.type !== 'omr' && (
                        <div className="absolute bottom-0 right-0 border-2 border-black p-1 bg-white flex flex-col items-center">
                          <span className="text-[8px] font-bold uppercase mb-1">Score</span>
                          <div className="w-8 h-6 border border-dashed border-slate-400"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-end z-10">
          <p className="text-[9px] font-mono font-bold text-black border border-black px-2 py-1 bg-white">
            SN: {serialNum} | SMART WORKSHEET BUILDER
          </p>
          
          <div className="border-[3px] border-red-500 bg-white p-2 w-32 print:border-black text-red-500 print:text-black shadow-sm">
            <p className="text-center font-bold text-[10px] uppercase mb-1">Total Score</p>
            <div className="h-10 border border-dashed border-red-300 print:border-black flex items-center justify-center">
              <span className="text-lg font-bold opacity-30">/{totalScore}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full -m-8 bg-slate-50">
      
      {/* Left Sidebar - Smart Worksheet Builder */}
      <div className="w-[500px] bg-white border-r border-slate-200 shadow-xl flex flex-col print:hidden h-full z-20">
        
        <div className="p-5 border-b border-slate-100 bg-white shadow-sm sticky top-0 z-30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center tracking-tight mb-1">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Smart Worksheet Builder
            </h2>
            <p className="text-slate-500 text-xs">Rich-text dynamic exam creator</p>
          </div>
          <button onClick={handleShuffle} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors flex items-center text-xs font-bold border border-amber-200">
            <Shuffle className="w-3.5 h-3.5 mr-1" /> Set {config.examVersion}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* STEP 1: Header Config */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center">
              <span className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center text-xs font-bold mr-2 shadow-sm">1</span>
              <h3 className="font-bold text-slate-700 text-sm">Header & Print Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={config.schoolName} onChange={e => setConfig({...config, schoolName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-bold" placeholder="School Name" />
                <input type="text" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Subject Title" />
              </div>
              <div className="flex items-center space-x-3">
                <select value={config.idMethod} onChange={e => setConfig({...config, idMethod: e.target.value})} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="bubble">Student ID: Bubble Matrix</option>
                  <option value="written">Student ID: Handwritten</option>
                </select>
                <select value={config.layoutUp} onChange={e => setConfig({...config, layoutUp: parseInt(e.target.value)})} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value={1}>Format: 1-Up (A4)</option>
                  <option value={2}>Format: 2-Up (Half)</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: Worksheet Sections Builder */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50/50 p-3 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mr-2 shadow-sm">2</span>
                <h3 className="font-bold text-indigo-900 text-sm">Dynamic Questions Editor</h3>
              </div>
              <button onClick={addSection} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 font-bold flex items-center">
                <Plus className="w-3 h-3 mr-1" /> Add Part
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {sections.map((section, sIdx) => (
                <div key={section.id} className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-sm">
                  <div className="bg-slate-200/50 p-2 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center flex-1">
                      <GripVertical className="w-4 h-4 text-slate-400 mr-1 cursor-grab" />
                      <input 
                        value={section.title}
                        onChange={(e) => {
                          const newSecs = [...sections];
                          newSecs[sIdx].title = e.target.value;
                          setSections(newSecs);
                        }}
                        className="bg-transparent font-bold text-xs outline-none w-full text-slate-700 uppercase tracking-wider"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-3">
                    {section.questions.map((q, qIdx) => (
                      <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative group">
                        
                        {/* Word-like Formatting Toolbar Mock */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                          <div className="flex space-x-1">
                            <button className="p-1 hover:bg-slate-100 rounded text-slate-600"><Bold className="w-3.5 h-3.5" /></button>
                            <button className="p-1 hover:bg-slate-100 rounded text-slate-600"><Italic className="w-3.5 h-3.5" /></button>
                            <button className="p-1 hover:bg-slate-100 rounded text-slate-600"><Underline className="w-3.5 h-3.5" /></button>
                            <div className="w-px h-4 bg-slate-200 mx-1 self-center"></div>
                            <button className="p-1 hover:bg-slate-100 rounded text-indigo-600" title="Insert Math Equation"><Calculator className="w-3.5 h-3.5" /></button>
                            <button className="p-1 hover:bg-slate-100 rounded text-emerald-600" title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={() => deleteQuestion(section.id, q.id)} className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-start">
                          <span className="text-xs font-bold text-slate-400 mt-2 mr-2">{qIdx + 1}.</span>
                          <textarea 
                            value={q.text}
                            onChange={(e) => updateQuestion(section.id, q.id, { text: e.target.value })}
                            className="w-full text-sm outline-none resize-none bg-transparent min-h-[40px] font-['Khmer_OS_Siemreap','Inter']"
                            placeholder="Type question here..."
                          />
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between bg-slate-50/50 -mx-3 -mb-3 p-2 px-3">
                          
                          {/* Type-specific configs */}
                          {q.type === 'omr' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Options:</span>
                              <select value={q.optionsCount} onChange={(e) => updateQuestion(section.id, q.id, { optionsCount: parseInt(e.target.value) })} className="text-xs border rounded px-1 outline-none">
                                {[2,3,4,5].map(n => <option key={n} value={n}>{n} Bubbles</option>)}
                              </select>
                              <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">Key:</span>
                              <select value={q.correctAnswer} onChange={(e) => updateQuestion(section.id, q.id, { correctAnswer: e.target.value })} className="text-xs border rounded px-1 outline-none text-emerald-600 font-bold">
                                {['A','B','C','D','E'].slice(0, q.optionsCount).map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                          )}

                          {q.type === 'short_answer' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Lines:</span>
                              <input type="number" min="1" max="10" value={q.lines} onChange={(e) => updateQuestion(section.id, q.id, { lines: parseInt(e.target.value) })} className="text-xs border rounded px-2 w-12 outline-none text-center" />
                            </div>
                          )}

                          {q.type === 'graph_box' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Box Size:</span>
                              <select value={q.boxHeight} onChange={(e) => updateQuestion(section.id, q.id, { boxHeight: e.target.value })} className="text-xs border rounded px-1 outline-none">
                                <option value="h-24">Small</option>
                                <option value="h-32">Medium</option>
                                <option value="h-48">Large</option>
                                <option value="h-64">Extra Large</option>
                              </select>
                            </div>
                          )}

                          <div className="flex items-center space-x-1">
                            <input type="number" value={q.points} onChange={(e) => updateQuestion(section.id, q.id, { points: parseInt(e.target.value) })} className="text-xs border rounded px-1 w-10 text-center font-bold text-indigo-600 outline-none" />
                            <span className="text-[10px] font-bold text-slate-400">pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Question Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <button onClick={() => addQuestion(section.id, 'omr')} className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center">
                        <Plus className="w-3 h-3 mr-1" /> Multiple Choice
                      </button>
                      <button onClick={() => addQuestion(section.id, 'short_answer')} className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center">
                        <Plus className="w-3 h-3 mr-1" /> Short Answer
                      </button>
                      <button onClick={() => addQuestion(section.id, 'graph_box')} className="flex-1 py-1.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center">
                        <Plus className="w-3 h-3 mr-1" /> Graph Box
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons (Footer) */}
        <div className="p-5 bg-white border-t border-slate-200 sticky bottom-0 z-30 shadow-[0_-15px_30px_rgba(0,0,0,0.03)]">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-3">
            <button onClick={() => setConfig({...config, printMode: 'blank'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${config.printMode === 'blank' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
              <Layout className="w-3.5 h-3.5 mr-2" /> Blank Paper
            </button>
            <button onClick={() => setConfig({...config, printMode: 'batch'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${config.printMode === 'batch' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>
              <Users className="w-3.5 h-3.5 mr-2" /> Class Batch
            </button>
          </div>
          <button onClick={handlePrint} className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-slate-900/20 text-sm hover:-translate-y-0.5">
            <Printer className="w-5 h-5" />
            <span>Save & Generate Vector PDF</span>
          </button>
        </div>
      </div>

      {/* Right Side - Paper Preview */}
      <div className="flex-1 bg-[#cbd5e1] overflow-y-auto p-12 print:p-0 print:bg-white print:overflow-visible flex flex-col items-center">
        {config.printMode === 'blank' ? (
          config.layoutUp === 1 ? renderSinglePaper() : (
            <div className="break-after-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 print:border-none flex flex-col justify-between p-4 shadow-xl print:shadow-none print:m-0">
              <div className="h-[48%] overflow-hidden relative border-b-2 border-dashed border-slate-300 print:border-black/30">
                {renderSinglePaper(null, true)}
              </div>
              <div className="h-[48%] overflow-hidden relative">
                {renderSinglePaper(null, true)}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-12 print:space-y-0 w-full flex flex-col items-center">
            {students.length > 0 ? students.map(student => (
              <div key={student.id}>
                {config.layoutUp === 1 ? renderSinglePaper(student) : (
                  <div className="break-after-page w-[210mm] min-h-[297mm] bg-white border border-slate-200 print:border-none flex flex-col justify-between p-4 shadow-xl print:shadow-none print:m-0">
                    <div className="h-[48%] overflow-hidden relative border-b-2 border-dashed border-slate-300 print:border-black/30">
                      {renderSinglePaper(student, true)}
                    </div>
                    <div className="h-[48%] overflow-hidden relative">
                      {renderSinglePaper(student, true)}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center p-12 bg-white rounded-2xl shadow-xl w-[210mm]">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No Students Found</h3>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
