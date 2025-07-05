'use client';

export default function DownloadJSONButton() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/quotes/sample-template.json';
    link.download = 'sample-template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className="w-full text-center bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium px-4 py-3 rounded-lg text-sm mt-10"
    >
      JSON&apos;ı İndir
    </button>
  );
} 