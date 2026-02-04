
import React, { useState, useEffect } from 'react';
import { Student, StudentFormData } from '../types';
import { DEPARTMENTS } from '../constants.tsx';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => void;
  initialData?: Student | null;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<StudentFormData>({
    rollNumber: '',
    name: '',
    gpa: 0,
    department: DEPARTMENTS[0],
    email: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        rollNumber: initialData.rollNumber,
        name: initialData.name,
        gpa: initialData.gpa,
        department: initialData.department,
        email: initialData.email,
      });
    } else {
      setFormData({
        rollNumber: '',
        name: '',
        gpa: 0,
        department: DEPARTMENTS[0],
        email: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
          <h3 className="text-lg font-bold text-indigo-900">
            {initialData ? 'Edit Student Record' : 'Add New Student'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={formData.rollNumber}
                onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="CS101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                max="4"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={formData.gpa}
                onChange={e => setFormData({ ...formData, gpa: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              value={formData.department}
              onChange={e => setFormData({ ...formData, department: e.target.value })}
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {initialData ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
