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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('processing');

    try {
      const text = await file.text();
      const success = await uploadCustomQuotes(text);
      
      if (success) {
        setUploadStatus('success');
        showToast(
          'Özel takım yorumular yüklendi!',
          'success'
        );
      } else {
        setUploadStatus('error');
        showToast(
          'Takım Yorumu dosyası geçerli değil',
          'error'
        );
      }
    } catch (error) {
      setUploadStatus('error');
      showToast(
        'Dosya yüklenirken bir hata oluştu',
        'error'
      );
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-gray-800/50 rounded-lg p-3 shadow-md border border-gray-700">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-base font-semibold text-white flex items-center gap-1">
        Takım Yorumu Sistemi
        </h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-gray-300 text-xs">
            Oylama sonuçlarına göre gösterilecek takım yorumu sistemini seçin:
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuoteSystemType('none')}
              className={`p-2 rounded-lg border-2 transition-all text-center relative ${
                quoteSystemType === 'none'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
              data-selected={quoteSystemType === 'none' ? "true" : "false"}
            >
              {quoteSystemType === 'none' && (
                <>
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-left hidden">▶</span>
                  <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-right hidden">◀</span>
                </>
              )}
              <div className="font-bold text-base">🚫</div>
              <div className="text-xs font-medium">Takım Yorumu Yok</div>
            </button>
            
            <button
              type="button"
              onClick={() => setQuoteSystemType('ci-team')}
              className={`p-2 rounded-lg border-2 transition-all text-center relative ${
                quoteSystemType === 'ci-team'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
              data-selected={quoteSystemType === 'ci-team' ? "true" : "false"}
            >
              {quoteSystemType === 'ci-team' && (
                <>
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-left hidden">▶</span>
                  <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-right hidden">◀</span>
                </>
              )}
              <div className="font-bold text-base">🍔</div>
              <div className="text-xs font-medium">C&I Hatırası</div>
            </button>
            
            <button
              type="button"
              onClick={() => setQuoteSystemType('custom')}
              className={`p-2 rounded-lg border-2 transition-all text-center relative ${
                quoteSystemType === 'custom'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
              data-selected={quoteSystemType === 'custom' ? "true" : "false"}
            >
              {quoteSystemType === 'custom' && (
                <>
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-left hidden">▶</span>
                  <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-pink-500 theme-indicator-right hidden">◀</span>
                </>
              )}
              <div className="font-bold text-base">📁</div>
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
            <div className="flex flex-col gap-3 mt-2">
              {/* Description paragraph */}
              <p className="text-xs text-gray-400 leading-snug">
                Eğer ekibinize ait özel bir takım yorumu paketi yüklemek isterseniz lütfen oluşturduğunuz JSON
                şablonunu yükleyiniz. Nasıl yapılacağını öğrenmek ve JSON şablonuna ulaşmak için
                <span className="font-medium text-yellow-300"> Kılavuz</span>&apos;dan yararlanabilirsiniz.
              </p>
              {/* Upload, template and guide buttons */}
              <div className="grid grid-cols-1 gap-2 w-full">
              <button
                  type="button"
                  onClick={() => window.open('/help/custom-quotes', '_blank')}
                  className="flex items-center justify-center gap-2 text-xs font-semibold px-2 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 transition-colors w-full"
                >
                  <span>Kılavuz</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center text-xs px-2 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 disabled:opacity-50 transition-colors w-full"
                  disabled={isUploading}
                >
                  {isUploading ? 'Yükleniyor...' : 'JSON Yükle'}
                </button>
                
                {/* Upload status indicator */}
                {uploadStatus !== 'idle' && (
                  <div className={`text-xs font-medium text-center ${
                    uploadStatus === 'processing' ? 'text-yellow-300' :
                    uploadStatus === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {uploadStatus === 'processing' && 'İşleniyor...'}
                    {uploadStatus === 'success' && 'Başarıyla yüklendi!'}
                    {uploadStatus === 'error' && 'Yükleme başarısız!'}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {quoteSystemType === 'ci-team' && (
            <p className="text-xs text-gray-400 mt-2">
              Kanal ve Entegrasyon ekibinin eğlenceli takım yorumları oylama sırasında gösterilecek. <br /> &quot;In Canberk We Trust.&quot;
            </p>
          )}

          {quoteSystemType === 'none' && (
            <p className="text-xs text-gray-400 mt-2">
              Takım Yorumu sistemi devre dışı bırakıldı. Oylama sırasında takım yorumular gösterilmeyecek.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 