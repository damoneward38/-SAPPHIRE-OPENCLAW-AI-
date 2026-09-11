import React, { useState } from 'react';
import { PluginItem } from '../types';
import { X, Plus, Sparkles, Check } from 'lucide-react';

interface InstallPluginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: (plugin: PluginItem) => void;
  onShowToast: (msg: string, type?: 'success' | 'warn' | 'error' | 'info') => void;
}

const PREMADE_PLUGINS: Omit<PluginItem, 'id' | 'on'>[] = [
  { name: 'GitHub Sync', desc: 'Auto-commit repository changes & PRs', icon: '🐙', color: '#24292e' },
  { name: 'Discord Webhook', desc: 'Forward alert notifications to channels', icon: '💬', color: '#5865F2' },
  { name: 'Docker Engine', desc: 'Container lifecycle & image management', icon: '🐳', color: '#2496ED' },
  { name: 'Redis Cache', desc: 'Key-value ephemeral cache buffer', icon: '⚡', color: '#DC382D' },
  { name: 'Postgres Pool', desc: 'Direct SQL execution client & query runner', icon: '🐘', color: '#336791' }
];

export const InstallPluginModal: React.FC<InstallPluginModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  onShowToast,
}) => {
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customIcon, setCustomIcon] = useState('🔌');
  const [customColor, setCustomColor] = useState('#0a84ff');

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      onShowToast('Please enter a plugin name', 'warn');
      return;
    }

    const newPlug: PluginItem = {
      id: customName.toLowerCase().replace(/\s+/g, '-'),
      name: customName.trim(),
      desc: customDesc.trim() || 'Custom user extension',
      icon: customIcon || '🔌',
      color: customColor,
      on: true
    };

    onInstall(newPlug);
    onShowToast(`Plugin "${newPlug.name}" installed successfully!`, 'success');
    onClose();
  };

  const handleInstallPremade = (p: Omit<PluginItem, 'id' | 'on'>) => {
    const newPlug: PluginItem = {
      ...p,
      id: p.name.toLowerCase().replace(/\s+/g, '-'),
      on: true
    };
    onInstall(newPlug);
    onShowToast(`Plugin "${p.name}" installed!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[#262626] bg-[#0c0c0c] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔌</span>
            <h2 className="text-sm font-black uppercase tracking-tight text-white font-headline">Install Plugin</h2>
          </div>
          <button id="btn-installpluginmodal-1" onClick={onClose} className="rounded-lg p-1 text-[#737373] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Premade list */}
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#737373]">
            One-Click Popular Extensions
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PREMADE_PLUGINS.map((p, idx) => (
              <div
                key={`premade_plugin_${p.name}_${idx}`}
                className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#141414] p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-lg">{p.icon}</span>
                  <div className="truncate">
                    <div className="font-bold text-white uppercase tracking-wider text-[11px]">{p.name}</div>
                    <div className="text-[10px] text-[#737373] truncate">{p.desc}</div>
                  </div>
                </div>
                <button id="btn-installpluginmodal-2"
                  onClick={() => handleInstallPremade(p)}
                  className="rounded border border-[#E0FF25]/40 bg-[#E0FF25]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#E0FF25] hover:bg-[#E0FF25]/20"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom form */}
        <form onSubmit={handleCreateCustom} className="border-t border-[#262626] pt-4 space-y-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#737373]">
            Create Custom Plugin
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Plugin Name (e.g. Stripe Webhook)"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white outline-none focus:border-[#E0FF25]"
              />
            </div>
            <div>
              <input
                type="text"
                value={customIcon}
                onChange={e => setCustomIcon(e.target.value)}
                placeholder="Emoji (e.g. 💳)"
                className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white outline-none focus:border-[#E0FF25]"
              />
            </div>
          </div>

          <input
            type="text"
            value={customDesc}
            onChange={e => setCustomDesc(e.target.value)}
            placeholder="Short description..."
            className="w-full rounded-lg border border-[#262626] bg-[#141414] px-3 py-2 text-xs text-white outline-none focus:border-[#E0FF25]"
          />

          <button id="btn-installpluginmodal-3"
            type="submit"
            className="w-full rounded-lg bg-[#E0FF25] py-2.5 text-[11px] font-black uppercase tracking-wider text-black shadow transition hover:bg-[#ccff00]"
          >
            Create & Install Plugin
          </button>
        </form>
      </div>
    </div>
  );
};
