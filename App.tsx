
import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentFormData, DashboardStats } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import StudentModal from './components/StudentModal';
import { DEPARTMENTS } from './constants.tsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  ResponsiveContainer
} from 'recharts';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'settings'>('dashboard');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Android Native-like Haptic Feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 30, heavy: 60 };
      navigator.vibrate(patterns[type]);
    }
  };

  useEffect(() => {
    setStudents(storageService.getStudents());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stats = useMemo<DashboardStats>(() => {
    if (students.length === 0) return { totalStudents: 0, averageGpa: 0, topPerformer: 'N/A', departmentCount: {} };
    const totalGpa = students.reduce((sum, s) => sum + s.gpa, 0);
    const top = [...students].sort((a, b) => b.gpa - a.gpa)[0];
    const deptCount: Record<string, number> = {};
    students.forEach(s => { deptCount[s.department] = (deptCount[s.department] || 0) + 1; });
    return {
      totalStudents: students.length,
      averageGpa: parseFloat((totalGpa / students.length).toFixed(2)),
      topPerformer: top.name,
      departmentCount: deptCount
    };
  }, [students]);

  const handleAddOrEdit = (data: StudentFormData) => {
    triggerHaptic('medium');
    if (editingStudent) {
      const updated = { ...editingStudent, ...data };
      storageService.updateStudent(updated);
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    } else {
      const newStudent = { ...data, id: crypto.randomUUID(), enrollmentDate: new Date().toISOString() };
      storageService.addStudent(newStudent);
      setStudents(prev => [...prev, newStudent]);
    }
    setEditingStudent(null);
  };

  const deleteStudent = (id: string) => {
    if (confirm("Permanently delete this record?")) {
      triggerHaptic('heavy');
      storageService.deleteStudent(id);
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const imported = await storageService.importData(e.target.files[0]);
        setStudents(imported);
        triggerHaptic('medium');
        alert('Excel Data Restored Successfully!');
      } catch (err) {
        alert(err);
      }
    }
  };

  const changeTab = (tab: any) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbff] pb-20 select-none">
      {/* Immersive Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-40 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l9-5-9-5-9 5 9 5z" /></svg>
          </div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Student Record System</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 max-w-lg mx-auto w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f3f3fa] p-5 rounded-[28px] border border-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Records</p>
                <p className="text-3xl font-black text-indigo-700">{stats.totalStudents}</p>
              </div>
              <div className="bg-[#f3f3fa] p-5 rounded-[28px] border border-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg GPA</p>
                <p className="text-3xl font-black text-indigo-700">{stats.averageGpa}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">Distribution by Dept</h3>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DEPARTMENTS.map(d => ({ name: d.substring(0, 3).toUpperCase(), val: stats.departmentCount[d] || 0 }))}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 900}} />
                    <Bar dataKey="val" fill="#4f46e5" radius={[8, 8, 8, 8]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-[32px] shadow-2xl shadow-indigo-100 text-white relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-5 rounded-full"></div>
               <h3 className="text-sm font-black flex items-center gap-2 mb-2 italic">
                 <svg className="w-5 h-5 text-indigo-200" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                 AI PERFORMANCE INSIGHTS
               </h3>
               <p className="text-xs leading-relaxed opacity-80 mb-6 min-h-[40px]">
                 {isOnline ? (aiInsight || "Generate a deep-learning analysis of your current records.") : "Network required for AI analysis."}
               </p>
               <button 
                 disabled={!isOnline || isAnalyzing}
                 onClick={async () => { triggerHaptic('medium'); setIsAnalyzing(true); setAiInsight(await geminiService.analyzePerformance(students)); setIsAnalyzing(false); }}
                 className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-md disabled:opacity-50"
               >
                 {isAnalyzing ? "ANALYZING..." : "EXECUTE AI ANALYSIS"}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search records..." className="w-full outline-none text-sm font-bold placeholder:text-slate-300 bg-transparent" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <button onClick={() => { triggerHaptic('medium'); setEditingStudent(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                <div key={s.id} className="bg-white p-5 rounded-[24px] border border-slate-50 flex items-center justify-between active:bg-indigo-50 transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs uppercase">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm truncate max-w-[120px]">{s.name}</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{s.rollNumber} • {s.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-indigo-50/50 rounded-lg text-right">
                      <p className="text-xs font-black text-indigo-600 leading-none">{s.gpa.toFixed(2)}</p>
                      <span className="text-[8px] font-black text-indigo-400">GPA</span>
                    </div>
                    <button onClick={() => deleteStudent(s.id)} className="p-2 text-rose-300 hover:text-rose-500 active:scale-90 transition-transform"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <div className="text-center py-20 text-slate-300 font-black text-xs uppercase tracking-widest">Database Empty</div>}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6">Spreadsheet Admin</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => { triggerHaptic('heavy'); storageService.exportData(); }}
                  className="w-full flex items-center justify-between p-5 bg-indigo-50 rounded-[24px] text-indigo-700 font-black active:bg-indigo-100 transition-colors"
                >
                  <span className="flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export to Excel</span>
                  <div className="bg-indigo-600 px-2 py-0.5 rounded text-[8px] text-white">XLSX</div>
                </button>

                <label className="w-full flex items-center justify-between p-5 bg-emerald-50 rounded-[24px] text-emerald-700 font-black cursor-pointer active:bg-emerald-100 transition-colors">
                  <span className="flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Import from Excel</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                  <div className="bg-emerald-600 px-2 py-0.5 rounded text-[8px] text-white">XLSX</div>
                </label>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[40px] text-slate-500 font-mono text-[9px] space-y-2 border border-slate-800 shadow-xl">
              <p className="flex justify-between"><span>APP_NAME</span> <span className="text-indigo-400">STUDENT_RECORD_SYSTEM</span></p>
              <p className="flex justify-between"><span>DATA_FORMAT</span> <span className="text-emerald-500">EXCEL_XLSX</span></p>
              <p className="flex justify-between"><span>VERSION</span> <span className="text-emerald-500">3.5.0-EXCEL</span></p>
              <p className="flex justify-between"><span>STORAGE</span> <span className="text-emerald-500">NATIVE_BRIDGE</span></p>
              <div className="h-px bg-slate-800 my-4"></div>
              <p className="text-center opacity-40">ENHANCED SPREADSHEET COMPATIBILITY</p>
            </div>
          </div>
        )}
      </main>

      {/* Android Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center h-20 px-4 z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {[
          { id: 'dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: 'records', label: 'Records', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { id: 'settings', label: 'Vault', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => changeTab(tab.id as any)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform"
          >
            <div className={`px-5 py-1.5 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-50'}`}>
              <svg className={`w-6 h-6 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} /></svg>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-indigo-700' : 'text-slate-300'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      <StudentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddOrEdit}
        initialData={editingStudent}
      />
    </div>
  );
};

export default App;
