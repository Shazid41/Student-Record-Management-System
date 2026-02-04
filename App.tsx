
import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentFormData, DashboardStats } from './types.ts';
import { storageService } from './services/storageService.ts';
import { geminiService } from './services/geminiService.ts';
import StudentModal from './components/StudentModal.tsx';
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

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
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
    setIsModalOpen(false);
  };

  const deleteStudent = (id: string) => {
    if (window.confirm("Permanently delete this record?")) {
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
        window.alert('Database Synchronized via Excel!');
      } catch (err) {
        window.alert(err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbff] pb-24 select-none">
      <header className="bg-white px-6 py-4 sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l9-5-9-5-9 5 9 5z" /></svg>
          </div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Student Records</h1>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
      </header>

      <main className="flex-1 p-5 max-w-lg mx-auto w-full animate-fade-in">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-3xl font-black text-indigo-700">{stats.totalStudents}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg GPA</p>
                <p className="text-3xl font-black text-indigo-700">{stats.averageGpa}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-6">Department Metrics</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DEPARTMENTS.map(d => ({ name: d.substring(0, 3).toUpperCase(), val: stats.departmentCount[d] || 0 }))}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 900}} />
                    <Bar dataKey="val" fill="#4f46e5" radius={[6, 6, 6, 6]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-indigo-600 p-7 rounded-[40px] shadow-2xl shadow-indigo-200 text-white relative overflow-hidden">
               <h3 className="text-sm font-black flex items-center gap-2 mb-3">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                 AI PERFORMANCE HUB
               </h3>
               <p className="text-xs leading-relaxed opacity-90 mb-6">
                 {isOnline ? (aiInsight || "Tap below to run deep analytics on your current database.") : "AI requires active network connection."}
               </p>
               <button 
                 disabled={!isOnline || isAnalyzing}
                 onClick={async () => { triggerHaptic('medium'); setIsAnalyzing(true); setAiInsight(await geminiService.analyzePerformance(students)); setIsAnalyzing(false); }}
                 className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs active:scale-95 transition-all shadow-xl disabled:opacity-50"
               >
                 {isAnalyzing ? "PROCESSING..." : "RUN ANALYSIS"}
               </button>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search Database..." className="w-full outline-none text-sm font-bold placeholder:text-slate-300 bg-transparent" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <button onClick={() => { triggerHaptic('medium'); setEditingStudent(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg active:scale-90 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                <div key={s.id} onClick={() => { setEditingStudent(s); setIsModalOpen(true); }} className="bg-white p-5 rounded-[28px] border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm truncate max-w-[140px]">{s.name}</p>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{s.rollNumber} • {s.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-indigo-50/50 rounded-xl text-center">
                      <p className="text-xs font-black text-indigo-600 leading-none">{s.gpa.toFixed(2)}</p>
                      <span className="text-[8px] font-black text-indigo-400 uppercase">GPA</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteStudent(s.id); }} className="p-2 text-rose-300 hover:text-rose-500 active:scale-90 transition-transform">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 && <div className="text-center py-24 text-slate-300 font-black text-[10px] uppercase tracking-widest">Storage System Ready</div>}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 tracking-tight">System Administration</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => { triggerHaptic('heavy'); storageService.exportData(); }}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-[28px] text-slate-700 font-black active:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-3"><svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Export Database</span>
                  <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-100 text-slate-400">XLSX</span>
                </button>

                <label className="w-full flex items-center justify-between p-5 bg-emerald-50 rounded-[28px] text-emerald-700 font-black cursor-pointer active:bg-emerald-100 transition-colors">
                  <span className="flex items-center gap-3"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> Restore Database</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                </label>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[48px] text-slate-500 font-mono text-[9px] space-y-2 border border-slate-800 shadow-2xl">
              <p className="flex justify-between"><span>KERNEL</span> <span className="text-indigo-400 uppercase">Android_NDK_Bridge</span></p>
              <p className="flex justify-between"><span>DATA_LINK</span> <span className="text-emerald-500 uppercase">SheetJS_Secure</span></p>
              <p className="flex justify-between"><span>VERSION</span> <span className="text-slate-400 uppercase">4.0.0-GOLD</span></p>
              <div className="h-px bg-slate-800 my-5"></div>
              <p className="text-center opacity-30 tracking-[0.2em] font-black">SYSTEM STATUS: OPTIMAL</p>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center h-20 px-6 z-50 pb-safe">
        {[
          { id: 'dashboard', label: 'Main', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: 'records', label: 'Database', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
          { id: 'settings', label: 'Admin', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => { triggerHaptic('light'); setActiveTab(tab.id as any); }}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            <div className={`px-5 py-1.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'text-slate-300'}`}>
              <svg className={`w-6 h-6 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} /></svg>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-indigo-700' : 'text-slate-300'}`}>
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
