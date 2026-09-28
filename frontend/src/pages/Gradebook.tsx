import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Download } from 'lucide-react';

export const Gradebook = () => {
  const [grades, setGrades] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await axios.get('http://localhost:3000/grades', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGrades(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchGrades();
  }, [token]);

  const handleExport = async () => {
    try {
      const res = await axios.get('http://localhost:3000/grades/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'grades_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Failed to export grades');
    }
  };

  return (
    <div className="animate-slide-up max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gradebook</h1>
          <p className="text-slate-500 mt-1">Finalized and verified student scores</p>
        </div>
        <button onClick={handleExport} className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg hover:-translate-y-0.5">
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </header>

      <div className="glass-panel overflow-hidden border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Student Code</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Assessment</th>
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium text-right">Score</th>
              <th className="px-6 py-4 font-medium text-right">Percentage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grades.map((grade: any) => (
              <tr key={grade.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-700">{grade.Student.student_code}</td>
                <td className="px-6 py-4 text-slate-600">{grade.Student.name}</td>
                <td className="px-6 py-4 text-slate-600">{grade.Assessment.name}</td>
                <td className="px-6 py-4 text-slate-600">{grade.Assessment.Subject.name}</td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-slate-900">{grade.score}</span>
                  <span className="text-slate-400 ml-1">/ {grade.Assessment.max_score}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    grade.percentage >= grade.Assessment.passing_score 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {grade.percentage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No verified grades available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
