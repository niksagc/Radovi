'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PortfolioPage() {
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWorks() {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_works')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching works:', error);
      } else {
        setWorks(data || []);
      }
      setLoading(false);
    }
    fetchWorks();
  }, [supabase]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab if download fails
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Portfolio Radovi</h1>
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <ul className="space-y-4">
          {works.map((work) => {
            const isPdf = work.file_url.toLowerCase().endsWith('.pdf');
            // Extract filename from URL to use as base for download name
            const urlParts = work.file_url.split('/');
            const originalFilename = urlParts[urlParts.length - 1];
            const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
            const downloadName = `${work.title}${extension}`;
            
            return (
              <li key={work.id} className="border p-4 rounded shadow flex items-center justify-between">
                <div>
                  <p className="font-semibold">{work.title}</p>
                  {work.description && <p className="text-sm text-zinc-600">{work.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDownload(work.file_url, downloadName)}
                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                  >
                    Preuzmi
                  </button>
                  {isPdf && (
                    <a 
                      href={work.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-3 py-1 bg-zinc-200 text-zinc-800 rounded hover:bg-zinc-300 text-sm"
                    >
                      Pregledaj
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
