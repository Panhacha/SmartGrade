import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const ScanProcessing = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/scans/${id}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatus(response.data);
      } catch (error) {
        console.error('Failed to fetch status', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [id, token]);

  if (!status) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const progress = status.total_files > 0 ? (status.processed_files / status.total_files) * 100 : 0;
  const isCompleted = status.status === 'COMPLETED';

  return (
    <div className="animate-slide-up max-w-2xl mx-auto mt-12">
      <div className="glass-panel p-10 text-center border border-slate-200">
        {!isCompleted ? (
          <>
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Processing Scans...</h2>
            <p className="text-slate-500 mt-2 mb-8">Our AI is analyzing the uploaded papers and extracting scores.</p>
            
            <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-slate-600">{status.processed_files} of {status.total_files} files processed</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Processing Complete!</h2>
            <p className="text-slate-500 mt-2 mb-8">All papers have been successfully analyzed.</p>
            <button 
              onClick={() => navigate('/verification')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              Review Results
            </button>
          </>
        )}
      </div>
    </div>
  );
};
