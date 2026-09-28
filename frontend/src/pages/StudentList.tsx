import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Download, Filter, ChevronLeft, ChevronRight, User, X, Users } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { StudentImportModal } from '../components/students/StudentImportModal';

export const StudentList = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  type ViewMode = 'classes' | 'class-detail' | 'all';
  const [viewMode, setViewMode] = useState<ViewMode>('classes');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  const [form, setForm] = useState({ student_code: '', name: '', class_name: '', gender: '' });
  
  const { token } = useAuth();

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/students/${editingId}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/students`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowModal(false);
      setForm({ student_code: '', name: '', class_name: '', gender: '' });
      setEditingId(null);
      fetchStudents();
    } catch (e: any) {
      alert('Error saving student: ' + e.response?.data?.message);
    }
  };

  const handleEdit = (student: any) => {
    setEditingId(student.id);
    setForm({ student_code: student.student_code, name: student.name, class_name: student.class_name, gender: student.gender || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchStudents();
    } catch (e) {
      alert('Cannot delete student. They may have existing grades or scans.');
    }
  };

  // Extract unique classes for the filter dropdown
  const uniqueClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.class_name).filter(Boolean));
    return Array.from(classes).sort();
  }, [students]);

  const classStats = useMemo(() => {
    const stats: Record<string, { total: number, male: number, female: number }> = {};
    uniqueClasses.forEach(c => {
      stats[c] = { total: 0, male: 0, female: 0 };
    });
    students.forEach(s => {
      if (s.class_name && stats[s.class_name]) {
        stats[s.class_name].total++;
        if (s.gender === 'ប' || s.gender?.toLowerCase() === 'm') stats[s.class_name].male++;
        else if (s.gender === 'ស' || s.gender?.toLowerCase() === 'f') stats[s.class_name].female++;
      }
    });
    return stats;
  }, [students, uniqueClasses]);

  // Filter students based on search and class filter
  const filtered = useMemo(() => {
    let result = students;
    if (viewMode === 'class-detail' && selectedClass) {
      result = result.filter(s => s.class_name === selectedClass);
    } else if (viewMode === 'all' && classFilter) {
      result = result.filter(s => s.class_name === classFilter);
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(lowerSearch) || 
        s.student_code.toLowerCase().includes(lowerSearch)
      );
    }
    return result;
  }, [students, search, classFilter, viewMode, selectedClass]);

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-fade-in">
      <div className="sticky -top-8 -mt-8 pt-8 -mx-8 px-8 bg-[#f8fafc] z-30 pb-6 border-b border-transparent shadow-none transition-shadow">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Roster</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage students, classes, and IDs</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              <span>Auto-Sync Data</span>
            </button>
            <button 
              onClick={() => { setEditingId(null); setForm({ student_code: '', name: '', class_name: '', gender: '' }); setShowModal(true); }}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>
        </header>

        {/* View Mode Toggle */}
        <div className="flex space-x-2 mb-6 bg-slate-200/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => { setViewMode('classes'); setSelectedClass(null); setSearch(''); }}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'classes' || viewMode === 'class-detail' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            By Class
          </button>
          <button 
            onClick={() => { setViewMode('all'); setSearch(''); }}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Students
          </button>
        </div>

        {/* Premium Toolbar */}
        {(viewMode === 'all' || viewMode === 'class-detail') && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
          {viewMode === 'class-detail' && (
            <button 
              onClick={() => { setViewMode('classes'); setSelectedClass(null); setSearch(''); }}
              className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-bold px-4 py-3 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by student name or ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {viewMode === 'all' && (
            <div className="w-64 relative">
              <Filter className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {uniqueClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        )}
      </div>

      {viewMode === 'classes' && (
        <div className="mt-4 flex flex-col space-y-2 pb-8">
          {/* Header Row */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 px-8 py-3 text-slate-500 font-black text-xs uppercase tracking-widest">
            <div>Class Name</div>
            <div>Total Students</div>
            <div>Male Students</div>
            <div>Female Students</div>
            <div className="text-right pr-2">Action</div>
          </div>

          {uniqueClasses.map(c => (
            <div 
              key={c}
              onClick={() => { setViewMode('class-detail'); setSelectedClass(c); }}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 px-8 py-2.5 items-center bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 group hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 hover:border-indigo-500 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0 shadow-inner">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 group-hover:text-white transition-colors text-lg">
                  {c}
                </span>
              </div>
              
              <div className="font-bold text-slate-600 group-hover:text-indigo-100 transition-colors">
                {classStats[c]?.total || 0} Students
              </div>
              
              <div>
                <span className="inline-flex px-3 py-1 rounded-lg text-sm font-bold border border-blue-100 bg-blue-50 text-blue-700 group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-colors">
                  {classStats[c]?.male || 0}
                </span>
              </div>
              
              <div>
                <span className="inline-flex px-3 py-1 rounded-lg text-sm font-bold border border-pink-100 bg-pink-50 text-pink-700 group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-colors">
                  {classStats[c]?.female || 0}
                </span>
              </div>
              
              <div className="flex justify-end">
                <button 
                  className="px-4 py-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-100 rounded-lg transition-all group-hover:bg-indigo-500 group-hover:text-white group-hover:hover:bg-white group-hover:hover:text-indigo-600 shadow-sm"
                >
                  View
                </button>
              </div>
            </div>
          ))}
          {uniqueClasses.length === 0 && (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
              <p className="text-slate-500 font-medium text-lg">No classes found. Add some students first.</p>
            </div>
          )}
        </div>
      )}

      {(viewMode === 'all' || viewMode === 'class-detail') && (
      <div className="mt-4 flex flex-col space-y-2 pb-8">
        <div className="grid grid-cols-[minmax(160px,2fr)_minmax(200px,3fr)_1fr_1fr_120px] gap-4 px-8 py-3 text-slate-500 font-black text-xs uppercase tracking-widest">
          <div>Student ID</div>
          <div>Full Name</div>
          <div>Class</div>
          <div>Gender</div>
          <div className="text-right pr-2">Actions</div>
        </div>

        {filtered.length > 0 ? (
          filtered.map(s => (
            <div 
              key={s.id} 
              className="grid grid-cols-[minmax(160px,2fr)_minmax(200px,3fr)_1fr_1fr_120px] gap-4 px-8 py-2.5 items-center bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 group hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 hover:border-indigo-500 transition-all duration-300 cursor-pointer"
            >
              <div className="font-mono font-bold text-slate-700 group-hover:text-white transition-colors text-base">
                {s.student_code}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0 shadow-inner">
                  {s.name.charAt(0)}
                </div>
                <span className="font-bold text-slate-900 group-hover:text-white transition-colors text-lg truncate">
                  {s.name}
                </span>
              </div>
              
              <div className="font-bold text-slate-600 group-hover:text-indigo-100 transition-colors">
                {s.class_name}
              </div>
              
              <div>
                {s.gender ? (
                  <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-bold border transition-colors ${
                    s.gender.includes('ស') || s.gender.toLowerCase() === 'f' 
                      ? 'bg-pink-50 text-pink-700 border-pink-100 group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent' 
                      : 'bg-blue-50 text-blue-700 border-blue-100 group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent'
                  }`}>
                    {s.gender}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm italic group-hover:text-indigo-200 transition-colors">N/A</span>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(s); }} 
                  className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-100 rounded-xl transition-all group-hover:bg-indigo-500 group-hover:text-white group-hover:hover:bg-white group-hover:hover:text-indigo-600 shadow-sm" 
                  title="Edit Student"
                >
                  <Edit2 className="w-4 h-4"/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeleteTargetId(s.id); }} 
                  className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-all group-hover:bg-indigo-500 group-hover:text-white group-hover:hover:bg-red-500 shadow-sm" 
                  title="Delete Student"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-slate-500 font-medium text-lg">No students found matching your criteria.</p>
          </div>
        )}
      </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Edit Profile' : 'New Student'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Student ID Code</label>
                <input required type="text" value={form.student_code} onChange={e => setForm({...form, student_code: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-mono font-bold text-slate-700 transition-all" placeholder="e.g. STU-001" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Full Name (ឈ្មោះ)</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-lg text-slate-800 transition-all" placeholder="Enter full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Class</label>
                  <input required type="text" value={form.class_name} onChange={e => setForm({...form, class_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-700 transition-all" placeholder="e.g. 10A" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Gender</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-700 transition-all appearance-none cursor-pointer">
                    <option value="">-- Select --</option>
                    <option value="ប">ប្រុស (Male)</option>
                    <option value="ស">ស្រី (Female)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30">Save Profile</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Remove Student?"
        message="Are you sure you want to completely remove this student from the system? This action cannot be undone."
        confirmText="Remove"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTargetId) handleDelete(deleteTargetId);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      <StudentImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => { fetchStudents(); setShowImportModal(false); }}
      />
    </div>
  );
};
