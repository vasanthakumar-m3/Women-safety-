/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface NotificationLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

interface NotificationLoggerProps {
  logs: NotificationLog[];
}

export default function NotificationLogger({ logs }: NotificationLoggerProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-64" id="notification-logger-container">
      {/* Logger Header */}
      <div className="bg-[#1e1e1e]/40 px-4.5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white">Security Command Console</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Live Link</span>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-slate-300 space-y-2 bg-[#0a0a0a]/50">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-650 gap-2">
            <RefreshCw className="w-6 h-6 text-slate-600 opacity-20 animate-spin" />
            <p className="text-[10px] uppercase tracking-wider text-slate-500 text-center max-w-[200px]">Awaiting active trigger sequence...</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-relaxed border-l border-white/5 pl-2.5 hover:bg-white/5 py-0.5">
              <span className="text-slate-600 select-none mr-2">[{log.timestamp}]</span>
              <span className={`${
                log.type === 'success'
                  ? 'text-emerald-400'
                  : log.type === 'error'
                  ? 'text-red-400 font-semibold'
                  : log.type === 'warn'
                  ? 'text-amber-400'
                  : 'text-sky-400'
              }`}>
                {log.type === 'success' && '✔ '}
                {log.type === 'error' && '✘ '}
                {log.type === 'warn' && '⚠ '}
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
