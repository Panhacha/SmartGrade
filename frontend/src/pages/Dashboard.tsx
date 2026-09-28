import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, FileText, CheckCircle, Clock, Plus, Upload, BookOpen, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchDashboard();
  }, [token]);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  const { stats, charts, recentActivity } = data;

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Assessments', value: stats.totalAssessments, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Graded Papers', value: stats.totalGraded, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  const quickActions = [
    { title: 'Add New Student', desc: 'Register a student', icon: Users, path: '/students', color: 'bg-blue-500 shadow-blue-500/30' },
    { title: 'Create Assessment', desc: 'Set up answer key', icon: FileText, path: '/assessments', color: 'bg-indigo-500 shadow-indigo-500/30' },
    { title: 'Scan Papers', desc: 'Upload exam images', icon: Upload, path: '/scans', color: 'bg-emerald-500 shadow-emerald-500/30' },
    { title: 'View Gradebook', desc: 'Check all results', icon: BookOpen, path: '/gradebook', color: 'bg-purple-500 shadow-purple-500/30' }
  ];

  return (
    <div className="animate-slide-up pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1 font-medium">Quick overview and easy management tools</p>
      </header>

      {/* Quick Manage Section */}
      <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-indigo-500"/> Quick Manage
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
         {quickActions.map(action => (
            <Link key={action.title} to={action.path} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all group flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-4">
                 <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{action.title}</p>
                   <p className="text-xs text-slate-500 font-medium">{action.desc}</p>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </Link>
         ))}
      </div>

      <h2 className="text-lg font-black text-slate-800 mb-4">System Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="glass-panel p-6 flex items-center space-x-4">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8 mb-8">
        <h2 className="text-lg font-black text-slate-800 mb-6">Recent Audit Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0 hover:bg-slate-50 p-2 rounded-lg transition-colors">
                <div>
                  <p className="font-semibold text-slate-700">Verified {log.student}'s Grade</p>
                  <p className="text-sm text-slate-500">Assessment: {log.assessment}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">{log.action}</span>
                  <p className="text-xs text-slate-400 mt-2">{new Date(log.date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-24 text-slate-400">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
};
