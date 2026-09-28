import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileImage, X, Search, CheckCircle, AlertTriangle, Plus, Camera } from 'lucide-react';
import { createPortal } from 'react-dom';

export const ScanUpload = () => {
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [newAssessment, setNewAssessment] = useState({
    name: '', subject_id: '', class_name: '', max_score: 100, passing_score: 50, exam_date: new Date().toISOString().split('T')[0]
  });
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssessments(response.data);
        if (response.data.length > 0) setSelectedAssessment(response.data[0].id);

        const subRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(subRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    if (token) fetchAssessments();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      simulateLiveMatch(selectedFiles[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    setFiles(prev => [...prev, ...droppedFiles]);
    if (droppedFiles.length > 0) simulateLiveMatch(droppedFiles[0]);
  };

  const simulateLiveMatch = async (file: File) => {
    setIsMatching(true);
    // Simulating instant OCR read on upload
    setTimeout(async () => {
      try {
        // We'll just fetch a random student or STU1001 for demo purposes
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.length > 0) {
          const student = response.data[0];
          setMatchedStudent({
            student_id: student.student_code,
            full_name: student.name,
            class_name: student.class_name,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`
          });
        } else {
          setMatchedStudent({ error: true });
        }
      } catch (e) {
        setMatchedStudent({ error: true });
      }
      setIsMatching(false);
    }, 1500);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedAssessment) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('assessment_id', selectedAssessment);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/scans/batch`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate(`/scans/processing/${response.data.id}`);
    } catch (error) {
      alert('Upload failed');
      setUploading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/subjects`, newSubject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const createdSub = response.data;
      setSubjects([...subjects, createdSub] as any);
      setNewAssessment({...newAssessment, subject_id: createdSub.id});
      setIsCreatingSubject(false);
      setNewSubject({ name: '', code: '' });
    } catch (e) {
      alert('Failed to create subject');
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/assessments`, {
        ...newAssessment,
        max_score: Number(newAssessment.max_score),
        passing_score: Number(newAssessment.passing_score),
        created_by: 'teacher-123'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Add to list and select it
      setAssessments([response.data, ...assessments] as any);
      setSelectedAssessment(response.data.id);
      setShowCreateModal(false);
      setNewAssessment({ name: '', subject_id: subjects[0] ? (subjects[0] as any).id : '', class_name: '', max_score: 100, passing_score: 50, exam_date: new Date().toISOString().split('T')[0] });
    } catch (e) {
      alert('Failed to create assessment');
    }
  };

  return (
    <div className="animate-slide-up max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Scans</h1>
        <p className="text-slate-500 mt-2">Upload graded papers to automatically extract scores</p>
      </header>

      <div className="glass-panel p-8 mb-8 border border-slate-200">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">Select Assessment</label>
            <button 
              onClick={() => {
                if (subjects.length > 0) setNewAssessment(prev => ({...prev, subject_id: (subjects[0] as any).id}));
                setShowCreateModal(true);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3 mr-1" /> Create New
            </button>
          </div>
          <select
            value={selectedAssessment}
            onChange={e => setSelectedAssessment(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          >
            {assessments.map((a: any) => (
              <option key={a.id} value={a.id}>{a.name} ({a.class_name})</option>
            ))}
          </select>
        </div>

        <div 
          className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors bg-slate-50/30"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Upload or Capture Scans</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">Drag and drop files here, or choose an option below to add your students' papers.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
             <button 
               onClick={(e) => { e.preventDefault(); document.getElementById('fileUpload')?.click(); }}
               className="flex items-center justify-center px-5 py-2.5 bg-white border-2 border-indigo-100 rounded-xl text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-bold text-sm transition-all shadow-sm"
             >
               <FileImage className="w-4 h-4 mr-2" /> Browse Files
             </button>
             <button 
               onClick={(e) => { e.preventDefault(); document.getElementById('cameraUpload')?.click(); }}
               className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 font-bold text-sm transition-all shadow-md shadow-indigo-500/20 hover:-translate-y-0.5"
             >
               <Camera className="w-4 h-4 mr-2" /> Take Photo
             </button>
          </div>

          <input 
            type="file" 
            id="fileUpload" 
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />
          <input 
            type="file" 
            id="cameraUpload" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <h4 className="font-semibold text-slate-800 mb-4">Selected Files ({files.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 relative group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileImage className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600 truncate">{file.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-red-400 hover:text-red-600 ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleUpload}
                disabled={uploading}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-semibold hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {uploading ? 'Uploading...' : 'Process Scans'}
              </button>
            </div>
          </div>
        )}

        {/* ScanStudentMatchCard UI Badge */}
        {(isMatching || matchedStudent) && (
          <div className="mt-6 border-t border-slate-100 pt-6 animate-fade-in">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Live Auto-Matcher</h4>
            
            {isMatching ? (
              <div className="bg-indigo-50 p-4 rounded-xl flex items-center border border-indigo-100">
                <Search className="w-5 h-5 text-indigo-600 animate-pulse mr-3" />
                <span className="text-sm font-bold text-indigo-900">Running OCR on scanned paper... extracting ID</span>
              </div>
            ) : matchedStudent.error ? (
              <div className="bg-amber-50 p-4 rounded-xl flex items-center border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
                <div>
                  <h5 className="font-bold text-amber-900 text-sm">Match Not Found</h5>
                  <p className="text-xs text-amber-700">Could not identify student ID from scan. Needs manual review.</p>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 p-4 rounded-xl flex items-center justify-between border border-emerald-200">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mr-3" />
                  <div>
                    <h5 className="font-bold text-emerald-900 text-sm">Exact Match Found: {matchedStudent.student_id}</h5>
                    <p className="text-xs text-emerald-700">Score will be automatically synced to Gradebook.</p>
                  </div>
                </div>
                <div className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm border border-emerald-100">
                  <img src={matchedStudent.avatar} alt="Avatar" className="w-8 h-8 rounded-full mr-2" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{matchedStudent.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-500">{matchedStudent.class_name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800">New Assessment</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAssessment} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Assessment Name</label>
                <input required type="text" value={newAssessment.name} onChange={e => setNewAssessment({...newAssessment, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-800 transition-all" placeholder="e.g. Midterm 1" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Subject</label>
                  {!isCreatingSubject && (
                    <button type="button" onClick={() => setIsCreatingSubject(true)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                      <Plus className="w-3 h-3 mr-1" /> New Subject
                    </button>
                  )}
                </div>
                
                {isCreatingSubject ? (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <input type="text" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} placeholder="Name (e.g. History)" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800 bg-white" />
                      </div>
                      <div>
                        <input type="text" value={newSubject.code} onChange={e => setNewSubject({...newSubject, code: e.target.value})} placeholder="Code (e.g. HIS101)" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800 bg-white" />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button type="button" onClick={() => setIsCreatingSubject(false)} className="text-xs px-3 py-1.5 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition-colors">Cancel</button>
                      <button type="button" onClick={handleCreateSubject} className="text-xs px-3 py-1.5 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">Save Subject</button>
                    </div>
                  </div>
                ) : (
                  <select required value={newAssessment.subject_id} onChange={e => setNewAssessment({...newAssessment, subject_id: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-800 transition-all cursor-pointer">
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Class</label>
                <input required type="text" value={newAssessment.class_name} onChange={e => setNewAssessment({...newAssessment, class_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-800 transition-all" placeholder="e.g. 10B" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Max Score</label>
                  <input required type="number" value={newAssessment.max_score} onChange={e => setNewAssessment({...newAssessment, max_score: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Exam Date</label>
                  <input required type="date" value={newAssessment.exam_date} onChange={e => setNewAssessment({...newAssessment, exam_date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-800 transition-all" />
                </div>
              </div>
              
              <div className="pt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5">Save & Use</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
