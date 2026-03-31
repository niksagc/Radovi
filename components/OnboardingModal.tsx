'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, CreditCard, Send, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Dobrodošli na StudyWorks!',
    icon: <BookOpen className="w-12 h-12 text-indigo-600 mb-4" />,
    content: (
      <div className="space-y-4 text-zinc-600">
        <p>
          Drago nam je što ste ovdje. StudyWorks je platforma koja vam pomaže u uređivanju, formatiranju i pripremi školskih dokumenata.
        </p>
        <p>
          Bilo da vam treba lektura eseja, formatiranje završnog rada ili izrada PowerPoint prezentacije, mi smo tu da vam olakšamo proces.
        </p>
      </div>
    ),
  },
  {
    id: 'services',
    title: 'Pregled usluga',
    icon: <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-4" />,
    content: (
      <div className="space-y-4 text-zinc-600">
        <p>
          U našem katalogu možete pronaći različite usluge podijeljene u kategorije:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Eseji i Seminari:</strong> Lektura i korektura teksta.</li>
          <li><strong>Završni radovi:</strong> Kompletno formatiranje prema uputama vašeg fakulteta ili škole.</li>
          <li><strong>Prezentacije:</strong> Dizajn i izrada profesionalnih slajdova.</li>
        </ul>
        <p>
          Također nudimo i <strong>dodatke (Add-ons)</strong> poput brze isporuke (Express) ili dodatnih izmjena.
        </p>
      </div>
    ),
  },
  {
    id: 'pricing',
    title: 'Cijene i plaćanje',
    icon: <CreditCard className="w-12 h-12 text-blue-600 mb-4" />,
    content: (
      <div className="space-y-4 text-zinc-600">
        <p>
          Nudimo fleksibilne opcije plaćanja kako biste bili sigurni u kvalitetu:
        </p>
        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
          <h4 className="font-bold text-zinc-900 mb-2">Modeli plaćanja:</h4>
          <ul className="space-y-2 text-sm">
            <li><strong>100% uplata:</strong> Platite cijeli iznos odjednom.</li>
            <li><strong>50% + 50% (Polog):</strong> Platite pola iznosa za početak rada. Kada završimo, dobit ćete pregled (s vodenim žigom). Nakon uplate preostalih 50%, preuzimate gotov rad.</li>
          </ul>
        </div>
        <p className="text-sm">
          Plaćanje se vrši direktno na IBAN račun ili karticama (Stripe). Prilikom odabira kartičnog plaćanja, na osnovni iznos narudžbe primjenjuje se naknada za obradu transakcije u iznosu od 2.9% + 0.30€.
        </p>
      </div>
    ),
  },
  {
    id: 'order',
    title: 'Kako naručiti?',
    icon: <Send className="w-12 h-12 text-purple-600 mb-4" />,
    content: (
      <div className="space-y-4 text-zinc-600">
        <ol className="list-decimal pl-5 space-y-3">
          <li>Odaberite usluge u <strong>Katalogu</strong> i dodajte ih u košaricu.</li>
          <li>Ispunite obrazac za narudžbu (tema, rok, upute mentora).</li>
          <li>Priložite svoje dokumente ako ih imate.</li>
          <li>Pratite status narudžbe na svojoj nadzornoj ploči.</li>
          <li>Komunicirajte s nama putem ugrađenog <strong>Chat sustava</strong> unutar narudžbe!</li>
        </ol>
      </div>
    ),
  },
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem('studyworks_onboarding_seen');
    if (!hasSeen) {
      // Small delay to not immediately pop up on login
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('studyworks_onboarding_seen', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-zinc-100">
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-8 bg-indigo-600' : 
                    idx < currentStep ? 'w-4 bg-indigo-200' : 'w-4 bg-zinc-200'
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              {step.icon}
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">{step.title}</h2>
              <div className="text-left w-full">
                {step.content}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                currentStep === 0 
                  ? 'text-zinc-300 cursor-not-allowed' 
                  : 'text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Nazad
            </button>
            
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {currentStep === steps.length - 1 ? 'Završi' : 'Dalje'}
              {currentStep !== steps.length - 1 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
