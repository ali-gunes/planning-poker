'use client';

import React, { useState, useRef } from 'react';
import { useQuoteSystem } from '@/contexts/QuoteContext';
import { useToast } from '@/contexts/ToastContext';

export function QuoteSystemSelector() {
  const { quoteSystemType, setQuoteSystemType, uploadCustomQuotes } = useQuoteSystem();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileContent = await file.text();
      const success = await uploadCustomQuotes(fileContent);
      
      if (success) {
        showToast('Özel alıntılar başarıyla yüklendi', 'success');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Dosya yüklenirken hata oluştu', 'error');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/quotes/sample-template.json', '_blank');
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-4 shadow-md border border-gray-700">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        Alıntı Sistemi
        </h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <p className="text-gray-300 text-sm">
            Oylama sonuçlarına göre gösterilecek alıntı sistemini seçin.
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setQuoteSystemType('none')}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                quoteSystemType === 'none'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-lg">🚫</div>
              <div className="text-xs font-medium">Alıntı Yok</div>
            </button>
            
            <button
              type="button"
              onClick={() => setQuoteSystemType('ci-team')}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                quoteSystemType === 'ci-team'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-lg">👥</div>
              <div className="text-xs font-medium">C&I Hatırası</div>
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (quoteSystemType !== 'custom') {
                  fileInputRef.current?.click();
                } else {
                  setQuoteSystemType('custom');
                }
              }}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                quoteSystemType === 'custom'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-bold text-lg">📁</div>
              <div className="text-xs font-medium">Özel</div>
            </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {quoteSystemType === 'custom' && (
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                disabled={isUploading}
              >
                {isUploading ? 'Yükleniyor...' : 'Farklı bir JSON yükle'}
              </button>
              
              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Şablon İndir
              </button>
            </div>
          )}
          
          {quoteSystemType === 'none' && (
            <p className="text-xs text-gray-400 mt-2">
              Alıntı sistemi devre dışı bırakıldı. Oylama sırasında alıntılar gösterilmeyecek.
            </p>
          )}
          
          {quoteSystemType === 'ci-team' && (
            <p className="text-xs text-gray-400 mt-2">
              C&I ekibinin eğlenceli alıntıları oylama sırasında gösterilecek.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 