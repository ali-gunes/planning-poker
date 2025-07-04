"use client";

import { useState } from "react";

interface NamePromptModalProps {
  isOpen: boolean;
  onSubmit: (name: string, role: 'participant' | 'observer') => void;
  error?: string | null;
}

export const NamePromptModal = ({ isOpen, onSubmit, error }: NamePromptModalProps) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<'participant' | 'observer'>('participant');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), role);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-sm m-4">
        <h2 className="text-2xl font-bold mb-4">Adınızı Girin</h2>
        <p className="text-gray-400 mb-6">
          Odaya katılmak için lütfen adınızı belirtin.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-200">
            {error}
          </div>
        )}
        
        <input
          type="text"
          placeholder="Adınız"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Rolünüz</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('participant')}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                role === 'participant'
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {/*<div className="font-bold">👥</div>*/}
              <div className="text-md font-bold">Katılımcı</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('observer')}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                role === 'observer'
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              {/*<div className="font-bold">👁️</div>*/}
              <div className="text-md font-bold">Gözlemci</div>
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!name.trim()}
          >
            Katıl
          </button>
        </div>
      </div>
    </div>
  );
}; 