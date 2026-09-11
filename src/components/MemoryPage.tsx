import React, { useState } from 'react';
import { MemoryItem, CodeUpdateItem } from '../types';
import { Brain, BookOpen, Zap, Trash2, Plus, Search } from 'lucide-react';

interface MemoryPageProps {
  longTermMemories: MemoryItem[];
  learnedMemories: MemoryItem[];
  codeUpdates: CodeUpdateItem[];
  onAddMemory: (title: string, body: string, type: 'longTerm' | 'shortTerm') => void;
  onDeleteMemory: (id?: number) => void;
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

export const MemoryPage: React.FC<MemoryPageProps> = ({
  longTermMemories,
  learnedMemories,
  codeUpdates,
  onAddMemory,
  onDeleteMemory,
  onShowToast,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newType, setNewType] = useState<'longTerm' | 'shortTerm'>('longTerm');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      onShowToast('Please enter both title and memory content', 'warn');
      return;
    }

    onAddMemory(newTitle.trim(), newBody.trim(), newType);
    setNewTitle('');
    setNewBody('');
    onShowToast('New memory saved to permanent database', 'success');
  };

  const filteredLongTerm = longTermMemories.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLearned = learnedMemories.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0b0c0f]">
      {/* Top Add Memory Bar */}
      <form onSubmit={handleAddSubmit} className="flex flex-wrap items-center gap-3 border-b border-[#252830] bg-[#13151a] p-3 sm:px-6">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Memory title..."
          className="min-w-[180px] flex-1 rounded-lg border border-[#252830] bg-[#1a1d24] px-3 py-1.5 text-xs text-white placeholder-[#5a6272] outline-none focus:border-[#a855f7]"
        />

        <input
          type="text"
          value={newBody}
          onChange={e => setNewBody(e.target.value)}
          placeholder="What should Sapphire remember?"
          className="min-w-[240px] flex-[2] rounded-lg border border-[#252830] bg-[#1a1d24] px-3 py-1.5 text-xs text-white placeholder-[#5a6272] outline-none focus:border-[#a855f7]"
        />

        <select
          value={newType}
          onChange={e => setNewType(e.target.value as any)}
          className="rounded-lg border border-[#252830] bg-[#1a1d24] px-3 py-1.5 text-xs text-white outline-none"
        >
          <option value="longTerm">Long-Term</option>
          <option value="shortTerm">Learned Fact</option>
        </select>

        <button id="btn-memorypage-1"
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-[#a855f7] px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-[#9333ea]"
        >
          <Plus className="h-3.5 w-3.5" /> Add Memory
        </button>

        {/* Search input */}
        <div className="relative ml-auto hidden sm:block">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#5a6272]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-48 rounded-lg border border-[#252830] bg-[#1a1d24] py-1.5 pl-8 pr-3 text-xs text-white placeholder-[#5a6272] outline-none focus:border-blue-500"
          />
        </div>
      </form>

      {/* 3-Column Memory Grid */}
      <div className="grid flex-1 grid-cols-1 divide-y divide-[#252830] overflow-hidden lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Column 1: Long-term memory */}
        <div className="flex flex-col overflow-hidden bg-[#0b0c0f]">
          <div className="flex items-center justify-between border-b border-[#252830] bg-[#13151a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#a855f7]">
            <span className="flex items-center gap-2">
              <Brain className="h-4 w-4" /> Long-Term Memory
            </span>
            <span className="rounded-full bg-[#a855f7]/20 px-2 py-0.5 text-[10px] text-[#a855f7]">
              {filteredLongTerm.length}
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredLongTerm.map((m, i) => (
              <div
                key={m.id || `lt_mem_${i}_${m.title || ''}`}
                className="group rounded-xl border border-[#252830] bg-[#13151a] p-3.5 transition hover:border-[#a855f7]/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
                    {m.title}
                  </div>
                  {m.id && (
                    <button id="btn-memorypage-2"
                      onClick={() => onDeleteMemory(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#5a6272] hover:text-red-400 transition"
                      title="Delete memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#8892a4]">{m.body}</p>
                <div className="mt-2 text-[10px] text-[#5a6272]">{m.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: What She's Learned */}
        <div className="flex flex-col overflow-hidden bg-[#0b0c0f]">
          <div className="flex items-center justify-between border-b border-[#252830] bg-[#13151a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> What She's Learned
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
              {filteredLearned.length}
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {filteredLearned.map((m, i) => (
              <div
                key={m.id || `lr_mem_${i}_${m.title || ''}`}
                className="group rounded-xl border border-[#252830] bg-[#13151a] p-3.5 transition hover:border-emerald-500/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {m.title}
                  </div>
                  {m.id && (
                    <button id="btn-memorypage-3"
                      onClick={() => onDeleteMemory(m.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#5a6272] hover:text-red-400 transition"
                      title="Delete learned fact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#8892a4]">{m.body}</p>
                <div className="mt-2 text-[10px] text-[#5a6272]">{m.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Self Code Updates */}
        <div className="flex flex-col overflow-hidden bg-[#0b0c0f]">
          <div className="flex items-center justify-between border-b border-[#252830] bg-[#13151a] px-4 py-3 text-xs font-bold uppercase tracking-wider text-amber-400">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Self Code Updates
            </span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">
              {codeUpdates.length}
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {codeUpdates.map((u, i) => (
              <div key={u.id || `code_upd_${i}_${u.file}_${u.time || ''}`} className="rounded-xl border border-[#252830] bg-[#13151a] p-3.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-amber-400">{u.file}</span>
                  <span className="text-[10px] text-[#5a6272]">{u.time}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#8892a4]">{u.desc}</p>
                <div className="mt-2.5 rounded-lg border border-[#252830] bg-[#080a0c] p-2.5 font-mono text-[11px] space-y-0.5">
                  <div className="text-emerald-400">{u.add}</div>
                  <div className="text-red-400">{u.rem}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
