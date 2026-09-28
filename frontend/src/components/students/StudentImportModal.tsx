import React, { useState } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { X, UploadCloud, Link as LinkIcon, CheckCircle, AlertTriangle, ArrowRight, Table, Wand2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentImportModal: React.FC<StudentImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [importSource, setImportSource] = useState<'FILE' | 'SHEET'>('FILE');
  const [sheetUrl, setSheetUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [targetClass, setTargetClass] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const processAndImport = async () => {
    setError('');
    setIsProcessing(true);
    
    if (!targetClass.trim()) {
      setError('Please provide a Target Class Name (e.g. 10A)');
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Upload and Parse Data
      let res;
      if (importSource === 'FILE' && file) {
        const formData = new FormData();
        formData.append('file', file);
        res = await axios.post('http://localhost:3000/students/import-file', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else if (importSource === 'SHEET' && sheetUrl) {
        res = await axios.post('http://localhost:3000/students/import-google-sheet', { sheet_url: sheetUrl }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        throw new Error('Please provide a file or URL');
      }
      
      const headers: string[] = res.data.headers;
      const rawData: any[] = res.data.rawData;
      
      // 2. Auto-Magic Mapping
      const mapping: any = { student_id: '', full_name: '', gender: '' };
      
      headers.forEach((h: string) => {
        const normalized = h.toLowerCase().trim().replace(/\s+/g, '');
        if (normalized.includes('id') || normalized.includes('code') || normalized.includes('អត្តលេខ')) {
          mapping.student_id = h;
        }
        if (normalized.includes('name') || normalized.includes('ឈ្មោះ') || normalized.includes('fullname')) {
          mapping.full_name = h;
        }
        if (normalized.includes('gender') || normalized.includes('sex') || normalized.includes('ភេទ')) {
          mapping.gender = h;
        }
      });

      if (!mapping.student_id || !mapping.full_name) {
        throw new Error(`Auto-Mapping Failed: Could not find columns for 'អត្តលេខ' (ID) or 'ឈ្មោះ' (Name). Found headers: ${headers.join(', ')}`);
      }

      // 3. Prepare Mapped Data
      const mappedData = rawData.map(row => ({
        student_id: row[mapping.student_id],
        full_name: row[mapping.full_name],
        gender: mapping.gender ? row[mapping.gender] : null,
        class_name: targetClass.trim(), // Force target class
        import_source: importSource === 'FILE' ? 'EXCEL' : 'GOOGLE_SHEET'
      }));

      // 4. Confirm Import
      await axios.post('http://localhost:3000/students/confirm-import', { mapped_data: mappedData }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'An error occurred during import.');
    }
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-slide-up max-h-[90vh]">
        
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Wand2 className="w-5 h-5 mr-2 text-indigo-600" />
            Auto-Sync Students
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start text-sm font-bold border border-red-100">
              <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" /> 
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            
            {/* Class Assignment */}
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <label className="block text-sm font-black text-indigo-900 mb-2 uppercase tracking-wider">Target Class Name</label>
              <input 
                type="text" 
                value={targetClass}
                onChange={e => setTargetClass(e.target.value)}
                placeholder="e.g. 10A, Math-101"
                className="w-full p-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-900"
              />
              <p className="text-xs text-indigo-700 mt-2 font-medium">All students in the uploaded file will be assigned to this class automatically.</p>
            </div>

            {/* Source Selection */}
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setImportSource('FILE')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${importSource === 'FILE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Excel / CSV File</button>
              <button onClick={() => setImportSource('SHEET')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${importSource === 'SHEET' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Google Sheets</button>
            </div>

            {importSource === 'FILE' ? (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-colors relative cursor-pointer group">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-slate-700">Click to upload Excel or CSV file</p>
                <p className="text-xs text-slate-500 mt-1">{file ? file.name : 'Drag and drop file here'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block">Google Sheets URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500">Note: Ensure the sheet sharing is set to "Anyone with the link can view".</p>
              </div>
            )}

            <button 
              onClick={processAndImport} 
              disabled={isProcessing || !targetClass || (importSource === 'FILE' && !file) || (importSource === 'SHEET' && !sheetUrl)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50 flex justify-center items-center shadow-xl shadow-indigo-600/20"
            >
              {isProcessing ? 'Processing AI Magic...' : 'Auto-Sync to Database'} <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
