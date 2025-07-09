import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface FeedbackButtonProps {
  theme?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ theme = 'default' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [systemInfo, setSystemInfo] = useState<{
    userAgent: string;
    screenSize: string;
    language: string;
    timeZone: string;
  }>({
    userAgent: '',
    screenSize: '',
    language: '',
    timeZone: '',
  });
  
  const params = useParams();
  const roomId = params?.roomId as string;

  useEffect(() => {
    // Collect system information when component mounts
    if (typeof window !== 'undefined') {
      setSystemInfo({
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Lütfen bir puan seçin');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          message,
          theme,
          roomId,
          systemInfo,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        // Reset form after 2 seconds
        setTimeout(() => {
          setRating(0);
          setMessage('');
          setIsModalOpen(false);
          setSubmitStatus('idle');
          setShowDataInfo(false);
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Feedback button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-auto h-10 md:h-12 rounded-full bg-gray-800 text-blue-400 flex items-center justify-center gap-2 px-4 shadow-lg hover:bg-gray-700 transition-all"
        aria-label="Geri bildirim"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span className="hidden md:inline font-semibold text-base">Geri Bildirim</span>
        <span className="inline md:hidden text-sm">Geri Bildirim</span>
      </button>

      {/* Feedback modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-gray-900/90 backdrop-blur-md rounded-lg p-6 w-full max-w-md relative z-10 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-center text-white">Geri Bildirim</h3>
            
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="text-green-400 text-5xl mb-4">✓</div>
                <p className="text-white">Geri bildiriminiz için teşekkürler!</p>
              </div>
            ) : submitStatus === 'error' ? (
              <div className="text-center py-8">
                <div className="text-red-400 text-5xl mb-4">✗</div>
                <p className="text-white">Bir hata oluştu. Lütfen tekrar deneyin.</p>
                <button 
                  onClick={() => setSubmitStatus('idle')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tekrar Dene
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Star rating */}
                <div className="flex justify-center mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl mx-1 focus:outline-none ${
                        rating >= star 
                          ? 'text-yellow-400 transform scale-110 feedback-star-selected' 
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                      aria-label={`Rate ${star} stars`}
                    >
                      ★
                      {rating >= star && (
                        <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center">
                          {star}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Feedback message */}
                <div className="mb-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Düşüncelerinizi paylaşın..."
                    className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none"
                    rows={4}
                    required
                  />
                </div>
                
                {/* Data collection info */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setShowDataInfo(!showDataInfo)}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className={`mr-1 transition-transform ${showDataInfo ? 'rotate-90' : ''}`}
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                    Toplanan Veriler Hakkında Bilgi
                  </button>
                  
                  {showDataInfo && (
                    <div className="mt-2 p-3 bg-gray-800 rounded-md text-xs text-gray-300">
                      <p className="mb-2">Geri bildiriminizle birlikte aşağıdaki bilgiler de toplanmaktadır:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Tarayıcı ve işletim sistemi bilgisi</li>
                        <li>Ekran boyutu: {systemInfo.screenSize}</li>
                        <li>Dil tercihi: {systemInfo.language}</li>
                        <li>Saat dilimi: {systemInfo.timeZone}</li>
                        <li>Tema tercihi: {theme}</li>
                        <li>Oda ID: {roomId || 'Mevcut değil'}</li>
                        <li>Tarih ve saat</li>
                      </ul>
                      <p className="mt-2 text-gray-400">Bu bilgiler uygulamamızı geliştirmek için kullanılacaktır ve kişisel olarak tanımlanabilir bilgiler içermez.</p>
                    </div>
                  )}
                </div>
                
                {/* Submit button */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    disabled={isSubmitting}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}; 