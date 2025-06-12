"use client";

import { useState } from "react";

interface NamePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const NamePromptModal = ({ isOpen, onClose, onSubmit }: NamePromptModalProps) => {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 shadow-xl w-full max-w-sm m-4">
        <h2 className="text-2xl font-bold mb-4">Adınızı Girin</h2>
        <p className="text-gray-400 mb-6">
          Odaya katılmak için lütfen adınızı belirtin.
        </p>
        <input
          type="text"
          placeholder="Adınız"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
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