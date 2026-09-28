import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Check, FileImage, AlertTriangle, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AlertModal } from '../components/ui/AlertModal';

export const Verification = () => {
  const [pendingResults, setPendingResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, type: 'error'|'success', title: string, message: string}>({
    isOpen: false, type: 'error', title: '', message: ''
  });
  const { token } = useAuth();
  
  const showAlert = (title: string, message: string, type: 'error'|'success' = 'error') => {
    setAlertConfig({ isOpen: true, type, title, message });
  };
  
  // Local state for editing the current result
  const [editScore, setEditScore] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/verification/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingResults(res.data);
      if (res.data.length > 0 && currentIndex === null) {
        setCurrentIndex(0);
      } else if (res.data.length > 0 && currentIndex !== null && currentIndex >= res.data.length) {
        setCurrentIndex(Math.max(0, res.data.length - 1));
      } else if (res.data.length === 0) {
        setCurrentIndex(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchPending();
  }, [token]);

  useEffect(() => {
    if (pendingResults.length > 0 && currentIndex !== null && pendingResults[currentIndex]) {
      const current = pendingResults[currentIndex] as any;
      setEditScore(current.detected_score?.toString() || '');
      setEditCode(current.detected_student_code || '');
    }
  }, [currentIndex, pendingResults]);

  const handleApprove = async () => {
    if (currentIndex === null) return;
    const current = pendingResults[currentIndex] as any;
    if (!current) return;
    
    if (!editCode.trim()) {
      showAlert("Missing ID", "Student ID is required to verify this result.", "error");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/verification/${current.id}/approve`, {
        finalScore: parseFloat(editScore) || 0,
        finalStudentCode: editCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPending();
    } catch (e: any) {
      showAlert("Verification Failed", e.response?.data?.message || 'Failed to approve result. Please ensure the student code exists.', "error");
    }
  };

  const handleDelete = async (resultId: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/verification/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPending();
    } catch (e) {
      showAlert("Error", "Failed to delete result. Please try again.", "error");
    }
  };
  
  if (pendingResults.length === 0) {
    return (
      <div className="animate-slide-up max-w-4xl mx-auto pb-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <Check className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">All Caught Up!</h1>
        <p className="text-slate-500 text-center">There are no scanned papers waiting for verification right now.</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up max-w-6xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Review Results</h1>
        <p className="text-slate-500 mt-1">{pendingResults.length} scans found waiting for verification.</p>
      </header>

      <div className="flex flex-col gap-3">
        {/* Table Headers */}
        <div className="grid grid-cols-12 px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider items-center">
          <div className="col-span-3">Scanned File</div>
          <div className="col-span-3">Detected ID</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Rows */}
        {pendingResults.map((result: any, index: number) => {
          const isActive = index === currentIndex;
          const hasWarnings = result.warnings && result.warnings.length > 0;
          
          return (
            <div 
              key={result.id} 
              className={`flex flex-col rounded-2xl transition-all duration-300 overflow-hidden ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/20' 
                  : 'bg-white border border-slate-100 shadow-sm hover:border-blue-200 text-slate-700'
              }`}
            >
              {/* Row Header */}
              <div 
                className="grid grid-cols-12 px-6 py-4 items-center cursor-pointer relative z-10"
                onClick={() => setCurrentIndex(isActive ? null : index)}
              >
                <div className="col-span-3 flex items-center gap-3 font-medium">
                  <div className={`p-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                    <FileImage className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className="truncate pr-2">{result.ScannedPaper?.file_url?.split('/').pop()}</span>
                </div>
                
                <div className="col-span-3 font-semibold">
                  {result.detected_student_code || 'N/A'}
                </div>
                
                <div className="col-span-2 font-bold">
                  {result.detected_score}
                </div>
                
                <div className="col-span-2 flex items-center">
                  <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : (hasWarnings ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : (hasWarnings ? 'bg-amber-500' : 'bg-emerald-500')}`}></div>
                    <span>{hasWarnings ? 'Review' : 'Pending'}</span>
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center justify-end space-x-2">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'}`}>
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {isActive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Content (Accordion) */}
              {isActive && (
                <div className="bg-slate-50 border-t border-blue-500/20 p-4 flex gap-4 text-slate-800 animate-fade-in relative z-0">
                  {/* Left: Image */}
                  <div className="flex-1 bg-white rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-200 shadow-inner">
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${result.ScannedPaper?.file_url || ''}`}
                      alt="Scanned Paper"
                      className="max-h-48 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/600x800/e2e8f0/475569?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  
                  {/* Right: Form */}
                  <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 p-4 relative">
                    {/* Confidence Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Confidence</span>
                        <span className={`text-xs font-black ${hasWarnings ? 'text-amber-600' : 'text-emerald-600'}`}>{Math.round((result.confidence || 0) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${hasWarnings ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                          style={{ width: `${(result.confidence || 0) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {hasWarnings && (
                      <div className="mb-4 bg-amber-50/80 rounded-xl p-3 border border-amber-200/60">
                        <h4 className="text-[10px] font-bold text-amber-900 flex items-center mb-1.5 uppercase tracking-wide"><AlertTriangle className="w-3 h-3 mr-1.5 text-amber-500"/> Review Needed</h4>
                        <ul className="text-[11px] font-medium text-amber-700 space-y-1 pl-4 list-disc marker:text-amber-400">
                          {result.warnings.map((w: string, i: number) => <li key={i}>{w.replace(/_/g, ' ')}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="flex-1 space-y-4">
                      {/* Student Info Card */}
                      {result.ScannedPaper?.Student ? (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 rounded-xl p-3.5 shadow-sm">
                           <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-100/50">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center"><Check className="w-3 h-3 mr-1"/> Matched Student</span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                                {result.ScannedPaper.Student.class_name} {result.ScannedPaper.Student.section ? `- ${result.ScannedPaper.Student.section}` : ''}
                              </span>
                           </div>
                           <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-black text-emerald-950 truncate">
                                  {result.ScannedPaper.Student.khmer_name || result.ScannedPaper.Student.name}
                                </span>
                                {result.ScannedPaper.Student.gender && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase">
                                    {result.ScannedPaper.Student.gender}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-emerald-700/80 font-medium grid grid-cols-2 gap-1.5">
                                 {result.ScannedPaper.Student.khmer_name && <span className="truncate" title={result.ScannedPaper.Student.name}>En: {result.ScannedPaper.Student.name}</span>}
                                 {result.ScannedPaper.Student.email && <span className="truncate col-span-2" title={result.ScannedPaper.Student.email}>✉ {result.ScannedPaper.Student.email}</span>}
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-3.5 shadow-sm">
                           <div className="flex items-center justify-between mb-2 pb-2 border-b border-rose-100/50">
                              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Unknown Student</span>
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">Not Found</span>
                           </div>
                           <p className="text-[11px] font-medium text-rose-600 mt-1 leading-relaxed">
                             We couldn't find a student with this ID. Please check the scan and correct the ID below.
                           </p>
                        </div>
                      )}

                      <div className="space-y-3.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Student ID</label>
                          <input 
                            type="text" 
                            value={editCode} 
                            onChange={e => setEditCode(e.target.value)}
                            className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white text-slate-900 uppercase transition-all shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Score</label>
                          <input 
                            type="number" 
                            value={editScore} 
                            onChange={e => setEditScore(e.target.value)}
                            className="w-full px-3 py-2 text-xl font-black rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white text-indigo-600 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-slate-100 flex gap-2">
                       <button 
                         onClick={handleApprove}
                         className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md shadow-indigo-500/20 hover:-translate-y-0.5"
                       >
                         <Check className="w-4 h-4 mr-1.5" /> Confirm & Verify
                       </button>
                       <button 
                         onClick={() => setDeleteTargetId(result.id)}
                         className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
                         title="Reject Scan"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Reject Scan Result?"
        message="Are you sure you want to delete this result? It will be permanently removed."
        confirmText="Delete"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
      
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
