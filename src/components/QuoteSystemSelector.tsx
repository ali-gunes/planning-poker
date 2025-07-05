'use client';

import React, { useState, useRef } from 'react';
import { useQuoteSystem } from '@/contexts/QuoteContext';
import { useToast } from '@/contexts/ToastContext';

// List of GIFs available in the public/gifs folder – shown to users when selecting the custom quote system
{/*const availableGifs = [
  'team-dance.gif',
  'no-power.gif',
  'coronation.gif',
  'pillow-man.gif',
  'gandalf.gif',
  'cool-spongebob.gif',
  'mark-dancing.gif',
  'surprised-pikachu.gif',
  'dodge.gif',
  'dicaprio-clapping.gif',
  'attack.gif',
];*/}

export function QuoteSystemSelector() {
  const { quoteSystemType, setQuoteSystemType, uploadCustomQuotes } = useQuoteSystem();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('processing');
    try {
      const fileContent = await file.text();
      const success = await uploadCustomQuotes(fileContent);
      
      if (success) {
        setUploadStatus('success');
        showToast('Özel alıntılar başarıyla yüklendi', 'success');
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Dosya yüklenirken hata oluştu', 'error');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
              <div className="font-bold text-lg">🍔</div>
              <div className="text-xs font-medium">C&I Hatırası</div>
            </button>
            
            <button
              type="button"
              onClick={() => setQuoteSystemType('custom')}
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
            <div className="flex flex-col gap-4 mt-2">
              {/* Description paragraph */}
              <p className="text-xs text-gray-400 leading-snug">
                Eğer ekibinize ait özel bir alıntı paketi yüklemek isterseniz lütfen oluşturduğunuz JSON
                şablonunu yükleyiniz. Nasıl yapılacağını öğrenmek ve JSON şablonuna ulaşmak için
                <span className="font-medium text-yellow-300"> Kılavuz</span>&apos;dan yararlanabilirsiniz.
              </p>
              {/* Upload, template and guide buttons */}
              <div className="grid grid-cols-1 gap-2 w-full">
              <button
                  type="button"
                  onClick={() => window.open('/help/custom-quotes', '_blank')}
                  className="flex items-center justify-center gap-2 text-xs font-semibold px-3 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 transition-colors w-full"
                >
                  <span>Kılavuz</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center text-xs px-2 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 disabled:opacity-50 transition-colors w-full"
                  disabled={isUploading}
                >
                  {isUploading ? 'Yükleniyor...' : 'JSON Yükle'}
                </button>
                
                {/* Upload status indicator */}
                {uploadStatus !== 'idle' && (
                  <div className="text-xs font-medium mt-1">
                    {uploadStatus === 'processing' && (
                      <span className="text-blue-400">Yükleniyor...</span>
                    )}
                    {uploadStatus === 'success' && (
                      <span className="text-green-400">✅ Başarılı bir şekilde yüklendi</span>
                    )}
                    {uploadStatus === 'error' && (
                      <span className="text-red-400">❌ Yükleme sırasında hata oluştu, JSON dosyanızı lütfen kontrol ediniz.</span>
                    )}
                  </div>
                )}

              </div>

              {/* Available GIFs showcase */}
              {/* <div>
                <h4 className="text-gray-200 text-xs mb-2">Mevcut GIF dosyaları:</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                  {availableGifs.map((gif) => (
                    <div key={gif} className="flex flex-col items-center text-center">
                      <img
                        src={`/gifs/${gif}`}
                        alt={gif}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 break-all">{gif}</span>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          )}
          
          {quoteSystemType === 'none' && (
            <p className="text-xs text-gray-400 mt-2">
              Alıntı sistemi devre dışı bırakıldı. Oylama sırasında alıntılar gösterilmeyecek.
            </p>
          )}
          
          {quoteSystemType === 'ci-team' && (
            <p className="text-xs text-gray-400 mt-2">
              Kanal ve Entegrasyon ekibinin eğlenceli alıntıları oylama sırasında gösterilecek. <br /> &quot;In Canberk We Trust.&quot;
            </p>
          )}
        </div>
      )}
    </div>
  );
} 