import fs from 'fs';
import path from 'path';
import React from 'react';
import DownloadJSONButton from '@/components/DownloadJSONButton';

export const metadata = {
  title: 'Alıntı Sistemi Kılavuzu'
};

const exampleQuoteSnippet = `{
  "id": "example-1",
  "name": "Gandalf the White",
  "role": "Wizard",
  "phrase": "You shall not pass!",
  "quote": "Sen düz git Frodo, zaten kafan karışık, yol seni bulur.",
  "animation": "gandalf.gif",
  "color": "from-orange-500 to-yellow-600"
}`;

/**
 * Renders a reference page for users who want to build their own quote packs.
 */
export default function CustomQuotesGuidePage() {
  const gifsDir = path.join(process.cwd(), 'public', 'gifs');
  const gifFiles = fs
    .readdirSync(gifsDir)
    .filter((file) => file.toLowerCase().endsWith('.gif'));

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Alıntı Sistemi Kılavuzu</h1>

      <p className="text-gray-300 mb-8">
        Aşağıdaki GIF&apos;leri ve alıntı JSON şablonunu kullanarak ekibinize özel eğlenceli bir alıntı paketi oluşturabilirsiniz. JSON dosyasını aşağıdaki buton yardımıyla indirip
        düzenledikten sonra oda yaratırken alıntı sistemi butonlarından &quot;Özel&quot; seçeneği ile yükleyebilirsiniz.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-4">Mevcut GIF&apos;ler</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-12">
        {gifFiles.map((gif) => (
          <div key={gif} className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/gifs/${gif}`}
              alt={gif}
              className="w-28 h-28 object-cover rounded-lg shadow"
            />
            <span className="mt-2 text-xs text-gray-400 break-all">{gif}</span>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold text-white mb-4">Alıntı Sistemi JSON Örneği</h2>
      <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto rounded-md text-xs whitespace-pre-wrap mb-6">
        {exampleQuoteSnippet}
      </pre>

      <h2 className="text-2xl font-semibold text-white mb-4">Önizleme</h2>
      <div
        className={
          `w-full sm:max-w-sm mx-auto bg-gradient-to-br ${JSON.parse(exampleQuoteSnippet).color} rounded-xl p-4 shadow-lg`
        }
      >
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/gifs/${JSON.parse(exampleQuoteSnippet).animation}`}
            alt={JSON.parse(exampleQuoteSnippet).name}
            className="rounded-lg shadow-md w-[320px] h-[240px] object-cover mb-3"
          />
          <h3 className="text-lg font-bold text-white mb-1">{JSON.parse(exampleQuoteSnippet).name} Diyor Ki:</h3>
          <p className="bg-white/90 text-gray-800 rounded-md px-3 py-2 text-sm font-medium italic mb-2">
            {JSON.parse(exampleQuoteSnippet).quote}
          </p>
          <span className="text-yellow-200 text-xs font-semibold">{JSON.parse(exampleQuoteSnippet).phrase}</span>
        </div>
      </div>

      <DownloadJSONButton />
    </div>
  );
} 