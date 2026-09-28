import React, { useState } from 'react';
import { Save, Sliders, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    gradingScale: 'percentage', // percentage, letter
    confidenceThreshold: 80,
    autoApprove: false,
    exportFormat: 'excel'
  });

  const handleSave = () => {
    // In a real app, save to backend or localStorage
    localStorage.setItem('sg_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-slide-up max-w-4xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 mt-1">Configure grading, OCR thresholds, and export preferences</p>
      </header>

      <div className="space-y-6">
        
        {/* OCR & AI Settings */}
        <div className="glass-panel p-8 border border-slate-200">
          <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Sliders className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">AI / OCR Recognition</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confidence Threshold ({settings.confidenceThreshold}%)</label>
              <p className="text-xs text-slate-500 mb-4">Results below this AI confidence level will be flagged as "Low Confidence" and require manual review.</p>
              <input 
                type="range" 
                min="50" max="100" 
                value={settings.confidenceThreshold}
                onChange={e => setSettings({...settings, confidenceThreshold: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                <span>50% (Loose)</span>
                <span>100% (Strict)</span>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer mt-4">
                <input 
                  type="checkbox" 
                  checked={settings.autoApprove}
                  onChange={e => setSettings({...settings, autoApprove: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-700">Auto-Approve High Confidence</span>
              </label>
              <p className="text-xs text-slate-500 mt-2 ml-8">Automatically send papers directly to Gradebook if confidence exceeds 95% and all validations pass.</p>
            </div>
          </div>
        </div>

        {/* Grading Settings */}
        <div className="glass-panel p-8 border border-slate-200">
          <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">Grading & Reports</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Score Display Format</label>
              <select 
                value={settings.gradingScale}
                onChange={e => setSettings({...settings, gradingScale: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="percentage">Percentage (e.g. 85%)</option>
                <option value="raw">Raw Score (e.g. 17/20)</option>
                <option value="letter">Letter Grade (A, B, C, D, F)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Default Export Format</label>
              <select 
                value={settings.exportFormat}
                onChange={e => setSettings({...settings, exportFormat: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="excel">Microsoft Excel (.xlsx)</option>
                <option value="csv">Comma Separated Values (.csv)</option>
              </select>
            </div>
          </div>
        </div>

      </div>
      
      <div className="mt-8 flex items-center justify-end space-x-4">
        {saved && <span className="text-emerald-600 font-medium animate-fade-in flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Settings Saved</span>}
        <button 
          onClick={handleSave}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg hover:-translate-y-0.5"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

    </div>
  );
};
