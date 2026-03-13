'use client';

import Logo from '@/components/Logo';
import { Download, Share2, Instagram, Facebook, Linkedin, FileText, BookOpen, PenTool } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useRef } from 'react';

export default function LogoPage() {
  const profileRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);

  const downloadImage = async (ref: React.RefObject<HTMLDivElement | null>, fileName: string, bgColor: string) => {
    if (ref.current === null) return;
    
    try {
      const dataUrl = await toPng(ref.current, { 
        cacheBust: true, 
        backgroundColor: bgColor,
        pixelRatio: 4,
        style: {
          transform: 'scale(1)',
        }
      });
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-4">
            StudyWorks Vizualni Identitet
          </h1>
          <p className="text-zinc-600">
            Preuzmite službeni logotip za korištenje na društvenim mrežama i u dokumentima.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Picture Format */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 flex flex-col items-center">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <Share2 size={18} className="text-indigo-600" />
              Profilna Slika (1:1)
            </h2>
            
            <div 
              ref={profileRef}
              className="relative w-64 h-64 flex flex-col items-center justify-center shadow-xl mb-8 overflow-hidden p-4"
              style={{ backgroundColor: '#000000' }}
            >
              <div className="scale-[2.2] mb-2 flex items-center justify-center">
                <div className="relative">
                  <BookOpen size={20} className="text-white" />
                  <PenTool 
                    size={12} 
                    className="absolute -top-1 -right-1 transform rotate-12 text-white" 
                  />
                </div>
              </div>
              <span className="text-white font-bold text-2xl tracking-tight mt-6" style={{ color: 'white' }}>StudyWorks</span>
            </div>

            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center gap-4 text-zinc-400 mb-2">
                <Instagram size={20} />
                <Facebook size={20} />
                <Linkedin size={20} />
              </div>
              <p className="text-sm text-zinc-500 text-center mb-4">
                Idealno za Instagram, Facebook i LinkedIn profile.
              </p>
              <button 
                onClick={() => downloadImage(profileRef, 'studyworks-profilna', '#000000')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi PNG
              </button>
            </div>
          </div>

          {/* Full Logo Format */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 flex flex-col items-center">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Puni Logotip
            </h2>
            
            <div 
              ref={fullRef}
              className="flex-grow flex items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-zinc-200 w-full mb-8"
            >
              <Logo variant="full" color="indigo" className="scale-150" />
            </div>

            <div className="space-y-4 w-full">
              <p className="text-sm text-zinc-500 text-center mb-4">
                Za zaglavlja dokumenata, web stranice i prezentacije.
              </p>
              <button 
                onClick={() => downloadImage(fullRef, 'studyworks-logo-puni', '#ffffff')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-zinc-300 text-sm font-medium rounded-xl text-zinc-700 bg-white hover:bg-zinc-50 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi PNG
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-900 mb-2 uppercase tracking-wider">Savjet za društvene mreže</h3>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Za najbolji izgled na društvenim mrežama, koristite kružnu verziju (lijevo). Tekst &quot;StudyWorks&quot; je sada integriran unutar kruga za bolju prepoznatljivost brenda.
          </p>
        </div>
      </div>
    </div>
  );
}
