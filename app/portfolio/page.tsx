'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PortfolioPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fileNameMap: { [key: string]: string } = {
    '0.40617449468938194.docx': 'ZAVRŠNI RAD - Dioklecijanova palača kao turistički brand grada Splita',
  };

  useEffect(() => {
    async function fetchFiles() {
      setLoading(true);
      const { data, error } = await supabase.storage.from('portfolio').list();
      if (error) {
        console.error('Error fetching files:', error);
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    }
    fetchFiles();
  }, [supabase]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Portfolio Radovi</h1>
      {loading ? (
        <p>Učitavanje...</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => {
            const { data } = supabase.storage.from('portfolio').getPublicUrl(file.name);
            const displayName = fileNameMap[file.name] || file.name;
            return (
              <li key={file.id} className="border p-4 rounded shadow">
                <p className="font-semibold">{displayName}</p>
                <a 
                  href={data.publicUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-500 hover:underline"
                >
                  Preuzmi/Pregledaj
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
