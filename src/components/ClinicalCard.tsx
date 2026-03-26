import React, { useState } from 'react';
import {
  AlertCircle, ChevronRight, Activity, Beaker, UserPlus,
  Download, FileText, ClipboardList, FileJson, Printer, CheckCheck
} from 'lucide-react';
import type { ClinicalData } from '../types';
import ayulexLogo from '../assets/ayulex-logo.png';

interface Props {
  rawResponse: string;
}

export const ClinicalCard: React.FC<Props> = ({ rawResponse }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  let data: ClinicalData | null = null;
  let parseError = false;

  try { data = JSON.parse(rawResponse) as ClinicalData; }
  catch (e) { parseError = true; }

  if (parseError || !data) {
    return <div className="p-6 bg-[#1E1F20] border border-white/5 rounded-2xl text-[#C4C7C5] font-mono text-sm">{rawResponse}</div>;
  }

  // --- HEALTHCARE EXPORT ENGINE ---
  const generateEMRText = () => {
    if (!data) return "";
    let text = `AYULEX CLINICAL ASSESSMENT REPORT\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `Urgency: ${data.urgency.toUpperCase()}\n\n`;

    if (data.red_flags && data.red_flags.length > 0) {
      text += `[CRITICAL RED FLAGS]\n`;
      data.red_flags.forEach(f => text += `- ${f}\n`);
      text += `\n`;
    }

    text += `[DIFFERENTIAL DIAGNOSIS]\n`;
    data.conditions.forEach(c => {
      const conf = c.confidence > 1 ? c.confidence : Math.round(c.confidence * 100);
      text += `- ${c.name} (${conf}% Match)\n`;
      text += `  Reasoning: ${c.reason}\n`;
    });

    text += `\n[RECOMMENDED ACTION PLAN]\n`;
    text += `Consult: ${data.next_steps.consult}\n`;
    text += `Indicated Tests:\n`;
    data.next_steps.tests.forEach(t => text += `- ${t}\n`);

    text += `\nDisclaimer: ${data.disclaimer}`;
    return text;
  };

  const handleCopyToEMR = () => {
    navigator.clipboard.writeText(generateEMRText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsExportOpen(false);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([generateEMRText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ayulex_Medical_Note_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ayulex_Raw_Data_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const handleNativePrint = () => {
    window.print();
    setIsExportOpen(false);
  };

  // --- GEMINI-STYLE DARK MODE STYLING ---
  const getUrgencyStyles = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' };
      case 'medium': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' };
      case 'low': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' };
      default: return { bg: 'bg-[#282A2C]', text: 'text-[#C4C7C5]', border: 'border-white/5', dot: 'bg-[#C4C7C5]' };
    }
  };

  const urgency = getUrgencyStyles(data.urgency);

  return (
    // SENIOR FIX: Removed max-w-4xl, letting it cleanly fill the chat container.
    <div className="relative w-full my-2 transition-all duration-300 print:m-0">

      {/* 📄 DARK EMR CARD */}
      <div className="bg-[#1E1F20] rounded-3xl border border-white/5 text-left font-sans p-6 sm:p-8 print:border-none print:p-0">

        {/* HEADER WITH EMBEDDED EXPORT MENU */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-6 border-b border-white/5 print:border-black">

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#282A2C] border border-white/5 flex items-center justify-center p-1.5 print:hidden">
              <img src={ayulexLogo} alt="Ayulex" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-[11px] font-semibold tracking-widest text-[#C4C7C5] uppercase mb-1 print:text-gray-500">Ayulex Diagnostic Engine</h2>
              <h3 className="text-xl font-medium text-[#E3E3E3] tracking-tight print:text-black">Clinical Assessment</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Urgency Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${urgency.bg} ${urgency.border} ${urgency.text} print:border-gray-500 print:text-black print:bg-transparent`}>
              <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot} animate-pulse print:animate-none print:bg-black`}></span>
              <span className="text-[11px] font-bold uppercase tracking-widest">{data.urgency} Priority</span>
            </div>

            {/* 📥 EXPORT MENU (Moved safely inside the layout flow) */}
            <div className="relative print:hidden">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="bg-[#282A2C] border border-white/10 text-[#C4C7C5] hover:text-[#E3E3E3] p-1.5 rounded-md transition-colors flex items-center justify-center"
                title="Export Options"
              >
                {copied ? <CheckCheck size={16} className="text-emerald-400" /> : <Download size={16} />}
              </button>

              {isExportOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsExportOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1E1F20] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40 flex flex-col py-1.5 animate-in fade-in zoom-in duration-150">
                    <span className="text-[10px] font-semibold text-[#C4C7C5] uppercase tracking-widest px-4 py-1.5 mb-1">Export Note</span>
                    <button onClick={handleCopyToEMR} className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#E3E3E3] hover:bg-[#282A2C] transition-colors w-full text-left">
                      <ClipboardList size={15} className={copied ? "text-emerald-400" : "text-[#C4C7C5]"} /> {copied ? "Copied!" : "Copy for EMR"}
                    </button>
                    <button onClick={handleNativePrint} className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#E3E3E3] hover:bg-[#282A2C] transition-colors w-full text-left">
                      <Printer size={15} className="text-[#C4C7C5]" /> Save as PDF
                    </button>
                    <div className="h-px bg-white/5 my-1 mx-3"></div>
                    <button onClick={handleDownloadTxt} className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#E3E3E3] hover:bg-[#282A2C] transition-colors w-full text-left">
                      <FileText size={15} className="text-[#C4C7C5]" /> Download .TXT
                    </button>
                    <button onClick={handleDownloadJson} className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#E3E3E3] hover:bg-[#282A2C] transition-colors w-full text-left">
                      <FileJson size={15} className="text-[#C4C7C5]" /> Download JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-8">
          {/* RED FLAGS */}
          {data.red_flags && data.red_flags.length > 0 && (
            <div className="bg-rose-500/5 rounded-2xl p-5 border border-rose-500/10 print:border-red-500 print:bg-transparent">
              <h4 className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-rose-400 uppercase mb-3 print:text-black">
                <AlertCircle size={14} strokeWidth={2.5} /> Critical Markers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                {data.red_flags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 rounded-full bg-rose-400 mt-2 shrink-0 print:bg-black"></div>
                    <span className="text-[14px] text-[#E3E3E3] leading-relaxed print:text-black">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DIFFERENTIAL */}
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-[#C4C7C5] uppercase mb-4 flex items-center gap-2 print:text-black">
              <Activity size={14} /> Diagnostic Probabilities
            </h4>
            <div className="space-y-3">
              {data.conditions.map((cond, idx) => {
                const conf = cond.confidence > 1 ? cond.confidence : Math.round(cond.confidence * 100);
                let barColor = conf >= 80 ? "bg-[#8AB4F8]" : conf >= 50 ? "bg-blue-400" : "bg-[#C4C7C5]";

                return (
                  <div key={idx} className="p-5 rounded-2xl bg-[#131314] border border-transparent print:border-gray-300 print:bg-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                      <span className="font-medium text-[#E3E3E3] text-[16px] tracking-tight print:text-black">{cond.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="w-24 sm:w-32 h-1.5 bg-[#282A2C] rounded-full overflow-hidden print:border print:border-gray-400">
                          <div className={`h-full rounded-full ${barColor} print:bg-black`} style={{ width: `${conf}%` }} />
                        </div>
                        <span className="text-[13px] font-mono text-[#C4C7C5] w-8 text-right print:text-black">{conf}%</span>
                      </div>
                    </div>
                    <p className="text-[14px] text-[#94A3B8] leading-relaxed print:text-black">{cond.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTION PLAN */}
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-[#C4C7C5] uppercase mb-4 flex items-center gap-2 print:text-black">
              <UserPlus size={14} /> Action Plan
            </h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#131314] border border-transparent print:border-gray-300 print:bg-transparent">
                <h5 className="text-[10px] font-semibold text-[#8AB4F8] uppercase tracking-widest mb-2 print:text-black">Specialist Routing</h5>
                <p className="text-[14px] text-[#E3E3E3] leading-relaxed print:text-black">{data.next_steps.consult}</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#131314] border border-transparent print:border-gray-300 print:bg-transparent">
                <h5 className="flex items-center gap-2 text-[10px] font-semibold text-[#8AB4F8] uppercase tracking-widest mb-2 print:text-black">
                  Laboratory & Imaging
                </h5>
                <ul className="space-y-1.5">
                  {data.next_steps.tests.map((test, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <ChevronRight size={14} className="text-[#5F6368] shrink-0 mt-0.5 print:text-black" />
                      <span className="text-[14px] text-[#E3E3E3] leading-relaxed print:text-black">{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>


          {/* VERIFIED SOURCES CITATION */}
          {data.sources && data.sources.length > 0 && (
            <div className="pt-5 mt-2 border-t border-white/5 print:border-black">
              <h4 className="text-[10px] font-bold tracking-widest text-[#C4C7C5] uppercase mb-3 print:text-black">
                Verified Clinical Sources
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((src, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-[#282A2C] border border-white/5 rounded-md text-[11px] font-medium text-[#94A3B8] print:border-gray-400 print:bg-transparent print:text-black">
                    {src.replace('[SOURCE: ', '').replace(']', '')}
                  </span>
                ))}
              </div>
            </div>
          )}



          {/* DISCLAIMER */}
          <div className="pt-5 mt-2 border-t border-white/5 print:border-black text-center">
            <p className="text-[10px] text-[#5F6368] font-medium uppercase tracking-widest print:text-gray-500">{data.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
};