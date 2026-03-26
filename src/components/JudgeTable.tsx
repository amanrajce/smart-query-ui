import React from 'react';
import type { JudgeEvaluation } from '../types';

interface Props {
  evaluations: JudgeEvaluation[];
}

export const JudgeTable: React.FC<Props> = ({ evaluations }) => {
  if (!evaluations || evaluations.length === 0) return null;

  const MetricBar = ({ label, score }: { label: string, score: number }) => {
    const percentage = (score / 10) * 100;

    // Change color based on metric for better clinical visual feedback
    let barColor = "bg-gray-300";
    if (label === "Safety" && score < 7) barColor = "bg-red-500";
    else if (label === "Safety") barColor = "bg-green-400";
    else if (label === "Reasoning") barColor = "bg-blue-400";

    return (
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-medium text-gray-500 w-24 uppercase tracking-tighter">
          {label}
        </span>
        <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden relative">
          <div 
            className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-700 ease-in-out`} 
            style={{ width: `${percentage}%`, opacity: score / 10 + 0.2 }}
          />
        </div>
        <span className="text-[11px] font-mono text-gray-400 w-6 text-right">{score}</span>
      </div>
    );
  };

  return (
    <div className="mt-10 border border-[#3E3E3E] rounded-lg bg-[#1A1A1A] overflow-hidden">
      {/* Header section with clinical styling */}
      <div className="px-5 py-3 border-b border-[#3E3E3E] bg-[#212121] flex justify-between items-center">
        <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="text-red-500">⚕️</span> Clinical Evaluation Summary
        </h3>
        <div className="text-[10px] font-mono text-gray-500 bg-[#1A1A1A] px-2 py-0.5 border border-[#3E3E3E] rounded">
          N=30 MAX_SCORE
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#3E3E3E] bg-[#1C1C1C]">
              <th className="py-3 px-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-16">Rank</th>
              <th className="py-3 px-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-48">AI Provider</th>
              <th className="py-3 px-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Diagnostic Metrics</th>
              <th className="py-3 px-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest w-24 text-right">Aggregate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {evaluations.map((evalItem, index) => (
              <React.Fragment key={evalItem.modelName}>
                <tr className="hover:bg-[#222222] transition-colors">
                  <td className="py-4 px-5">
                    <span className={`text-[13px] font-mono ${index === 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                      0{index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-[13px] font-semibold text-gray-200 tracking-tight">
                      {evalItem.modelName}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="grid grid-cols-1 gap-x-8">
                      {/* Using the new clinical score keys */}
                      <MetricBar label="Safety" score={evalItem.scores.safety || 0} />
                      <MetricBar label="Reasoning" score={evalItem.scores.reasoning || 0} />
                      <MetricBar label="Completeness" score={evalItem.scores.completeness || 0} />
                    </div>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className={`text-[15px] font-mono font-bold ${index === 0 ? 'text-white' : 'text-gray-400'}`}>
                      {evalItem.totalScore}
                    </span>
                  </td>
                </tr>
                {/* Clinical Justification Sub-row */}
                <tr className="bg-[#1C1C1C]/50">
                  <td colSpan={4} className="px-5 py-2.5">
                    <p className="text-[11px] text-gray-500 leading-relaxed font-light italic max-w-3xl">
                      <span className="text-[9px] font-bold uppercase mr-2 not-italic text-blue-400">CMO Justification:</span>
                      {evalItem.reason}
                    </p>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};