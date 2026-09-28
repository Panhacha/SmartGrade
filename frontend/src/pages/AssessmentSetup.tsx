import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Calendar } from 'lucide-react';

export const AssessmentSetup = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    class_name: '',
    max_score: 100,
    passing_score: 50,
    exam_date: '',
  });
  const { token, user } = useAuth();
  
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/subjects`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubjects(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, subject_id: response.data[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch subjects', error);
      }
    };
    if (token) fetchSubjects();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/assessments`, {
        ...formData,
        created_by: user?.id,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Assessment created successfully!');
      setFormData({
        name: '',
        subject_id: subjects.length > 0 ? (subjects[0] as any).id : '',
        class_name: '',
        max_score: 100,
        passing_score: 50,
        exam_date: '',
      });
    } catch (error) {
      alert('Failed to create assessment');
    }
  };

  return (
    <div className="animate-slide-up">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Assessment</h1>
        <p className="text-slate-500 mt-1">Configure a new test for automated grading</p>
      </header>

      <div className="glass-panel p-8 max-w-2xl border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                placeholder="e.g., Midterm Exam 2024"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={formData.subject_id}
                onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                required
              >
                {subjects.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class/Section</label>
              <input
                type="text"
                value={formData.class_name}
                onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                placeholder="e.g., 10A"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Maximum Score</label>
              <input
                type="number"
                value={formData.max_score}
                onChange={e => setFormData({ ...formData, max_score: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                required
                min={1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score</label>
              <input
                type="number"
                value={formData.passing_score}
                onChange={e => setFormData({ ...formData, passing_score: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                required
                min={0}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Exam Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={formData.exam_date}
                  onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                  className="w-full pl-11 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center space-x-2 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Assessment</span>
          </button>
        </form>
      </div>
    </div>
  );
};
