import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  FileText,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Download,
  Search,
  Plus,
  Laptop,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Tag
} from 'lucide-react';
import { EmailDraft, DocumentationItem, GoogleDocItem, FireflyBridgeStatus } from '../types';
import { chime } from '../utils/audioChimes';

interface FireflyAssistantSuiteProps {
  bridgeStatus: FireflyBridgeStatus;
  onExecuteComputerCommand?: (command: string, bypass?: boolean) => Promise<any>;
  onShowToast: (msg: string, type: 'success' | 'warn' | 'error' | 'info') => void;
  initialTab?: 'email' | 'docs' | 'gdocs';
}

export const FireflyAssistantSuite: React.FC<FireflyAssistantSuiteProps> = ({
  bridgeStatus,
  onExecuteComputerCommand,
  onShowToast,
  initialTab = 'email'
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'docs' | 'gdocs'>(initialTab);

  // Email state
  const [emailTo, setEmailTo] = useState('damoneward38@gmail.com');
  const [emailSubject, setEmailSubject] = useState('Production Status & Architecture Update');
  const [emailTone, setEmailTone] = useState<'professional' | 'technical' | 'concise' | 'warm' | 'urgent'>('professional');
  const [emailContext, setEmailContext] = useState('Project progress update on Firefly autonomy bridge and Google Docs integration.');
  const [emailKeyPoints, setEmailKeyPoints] = useState('Bridge daemon operational on port 8765\nSay Okay voice handshake active\nGoogle Docs synchronization online');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [currentEmailDraft, setCurrentEmailDraft] = useState<EmailDraft | null>(null);
  const [emailHistory, setEmailHistory] = useState<EmailDraft[]>([]);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Documentation state
  const [docTitle, setDocTitle] = useState('Firefly Autonomous System Architecture');
  const [docTopic, setDocTopic] = useState('Local Computer Bridge, Google Docs Ingestion & Continuous Voice Pipelines');
  const [docType, setDocType] = useState<'architecture' | 'api' | 'user_guide' | 'sprint_report' | 'whitepaper'>('architecture');
  const [docNotes, setDocNotes] = useState('Focus on zero-latency streaming, echo-shielded voice loop, and authenticated HTTP execution on port 8765.');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<DocumentationItem | null>(null);
  const [docsList, setDocsList] = useState<DocumentationItem[]>([]);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Google Docs state
  const [gdocsList, setGdocsList] = useState<GoogleDocItem[]>([]);
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isSyncingGdoc, setIsSyncingGdoc] = useState(false);

  // Load existing records
  useEffect(() => {
    fetch('/api/assistant/email/history')
      .then(r => r.json())
      .then(data => {
        if (data.emails) setEmailHistory(data.emails);
      })
      .catch(() => {});

    fetch('/api/assistant/docs/list')
      .then(r => r.json())
      .then(data => {
        if (data.docs) setDocsList(data.docs);
      })
      .catch(() => {});

    fetch('/api/assistant/gdocs/list')
      .then(r => r.json())
      .then(data => {
        if (data.docs) setGdocsList(data.docs);
      })
      .catch(() => {});
  }, []);

  // 1. Compose Email
  const handleComposeEmail = async () => {
    setIsGeneratingEmail(true);
    try {
      const points = emailKeyPoints.split('\n').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/assistant/email/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          context: emailContext,
          tone: emailTone,
          keyPoints: points
        })
      });
      const data = await res.json();
      if (data.success && data.draft) {
        setCurrentEmailDraft(data.draft);
        setEmailHistory(prev => [data.draft, ...prev.filter(e => e.id !== data.draft.id)]);
        onShowToast('Email composed successfully by Firefly', 'success');
        chime.playWakeChime();
      } else {
        onShowToast(data.error || 'Failed to compose email', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Dispatch Email
  const handleDispatchEmail = async (method: 'mailto' | 'bridge') => {
    if (!currentEmailDraft) return;

    if (method === 'bridge' && bridgeStatus.connected && onExecuteComputerCommand) {
      const mailtoCmd = process.platform === 'win32'
        ? `start "" "mailto:${currentEmailDraft.to}?subject=${encodeURIComponent(currentEmailDraft.subject)}&body=${encodeURIComponent(currentEmailDraft.body)}"`
        : `open "mailto:${currentEmailDraft.to}?subject=${encodeURIComponent(currentEmailDraft.subject)}&body=${encodeURIComponent(currentEmailDraft.body)}"`;
      
      await onExecuteComputerCommand(mailtoCmd, true);
      onShowToast(`Dispatched to your default email client via computer bridge!`, 'success');
    } else {
      const link = `mailto:${encodeURIComponent(currentEmailDraft.to)}?subject=${encodeURIComponent(currentEmailDraft.subject)}&body=${encodeURIComponent(currentEmailDraft.body)}`;
      window.open(link, '_blank');
      onShowToast('Opened email in browser client', 'info');
    }

    // Mark as sent in record
    fetch('/api/assistant/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentEmailDraft)
    })
      .then(r => r.json())
      .then(d => {
        if (d.email) {
          setEmailHistory(prev => [d.email, ...prev.filter(e => e.id !== d.email.id)]);
        }
      });
  };

  // 2. Generate Documentation
  const handleGenerateDoc = async () => {
    setIsGeneratingDoc(true);
    try {
      const res = await fetch('/api/assistant/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          topic: docTopic,
          docType,
          notes: docNotes
        })
      });
      const data = await res.json();
      if (data.success && data.doc) {
        setCurrentDoc(data.doc);
        setDocsList(prev => [data.doc, ...prev.filter(d => d.id !== data.doc.id)]);
        onShowToast(`Generated technical documentation: ${data.doc.title}`, 'success');
        chime.playWakeChime();
      } else {
        onShowToast(data.error || 'Failed to generate documentation', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Download Doc
  const handleDownloadDoc = (doc: DocumentationItem) => {
    const blob = new Blob([doc.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast(`Downloaded ${a.download}`, 'success');
  };

  // 3. Google Docs Launch & Sync
  const handleLaunchGoogleDocs = async (action: 'new_doc' | 'new_sheet' | 'new_slides' | 'search_drive' | 'open_doc', targetUrl?: string) => {
    try {
      const res = await fetch('/api/assistant/gdocs/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUrl })
      });
      const data = await res.json();
      const url = data.url;

      if (bridgeStatus.connected && onExecuteComputerCommand && data.suggestedBridgeCommand) {
        await onExecuteComputerCommand(data.suggestedBridgeCommand, true);
        onShowToast(`Launched Google Docs in your local computer browser!`, 'success');
      } else {
        window.open(url, '_blank');
        onShowToast(`Opened ${action.replace('_', ' ')} in new tab`, 'info');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  // Ingest Google Doc into Knowledge Base
  const handleSyncGoogleDoc = async () => {
    if (!newDocUrl && !newDocTitle) {
      onShowToast('Please provide a Google Doc URL or Title', 'warn');
      return;
    }
    setIsSyncingGdoc(true);
    try {
      const res = await fetch('/api/assistant/gdocs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docUrl: newDocUrl,
          title: newDocTitle,
          content: newDocContent
        })
      });
      const data = await res.json();
      if (data.success && data.doc) {
        setGdocsList(prev => [data.doc, ...prev.filter(g => g.id !== data.doc.id)]);
        setNewDocUrl('');
        setNewDocTitle('');
        setNewDocContent('');
        onShowToast(`Synchronized Google Doc: "${data.doc.title}" into Firefly memory!`, 'success');
        chime.playWakeChime();
      } else {
        onShowToast(data.error || 'Failed to sync Google Doc', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsSyncingGdoc(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-neutral-200 border border-[#222] rounded-xl overflow-hidden shadow-2xl">
      {/* Top Suite Bar */}
      <div className="flex items-center justify-between border-b border-[#222] bg-[#111] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E0FF25]/10 text-[#E0FF25] border border-[#E0FF25]/30">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Firefly Autonomous Assistant Suite</span>
              <span className="rounded bg-[#222] px-2 py-0.5 text-[10px] font-bold text-[#E0FF25]">v3.9 Autonomy</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Emails, Technical Documentation & Google Docs Integration
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 rounded-lg bg-[#050505] p-1 border border-[#222]">
          <button
            id="btn-suite-tab-email"
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'email'
                ? 'bg-[#E0FF25] text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Write Emails</span>
          </button>

          <button
            id="btn-suite-tab-docs"
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'docs'
                ? 'bg-[#E0FF25] text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Documentation</span>
          </button>

          <button
            id="btn-suite-tab-gdocs"
            onClick={() => setActiveTab('gdocs')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'gdocs'
                ? 'bg-[#E0FF25] text-black shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Google Docs Hub</span>
          </button>
        </div>
      </div>

      {/* Main Suite Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: EMAIL ASSISTANT */}
        {activeTab === 'email' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Email Composer Inputs */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="rounded-xl border border-[#222] bg-[#111] p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#E0FF25]" />
                  <span>AI Email Composer</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Recipient (To)</label>
                    <input
                      id="input-email-to"
                      type="text"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="e.g. damoneward38@gmail.com, team@company.com"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Subject</label>
                    <input
                      id="input-email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Email subject or topic"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Tone</label>
                      <select
                        id="select-email-tone"
                        value={emailTone}
                        onChange={e => setEmailTone(e.target.value as any)}
                        className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                      >
                        <option value="professional">Professional / Executive</option>
                        <option value="technical">Technical / Detailed</option>
                        <option value="concise">Concise / High-Impact</option>
                        <option value="warm">Warm / Friendly</option>
                        <option value="urgent">Urgent / Action Required</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Computer Dispatch</label>
                      <div className="flex items-center gap-2 rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs">
                        <Laptop className="h-3.5 w-3.5 text-[#E0FF25]" />
                        <span className="text-[11px] text-neutral-300">
                          {bridgeStatus.connected ? 'Bridge Connected' : 'Web Fallback'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Key Talking Points (One per line)</label>
                    <textarea
                      id="textarea-email-points"
                      rows={3}
                      value={emailKeyPoints}
                      onChange={e => setEmailKeyPoints(e.target.value)}
                      placeholder="Bullet points Firefly will weave into the email"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none resize-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Background Context</label>
                    <input
                      id="input-email-context"
                      type="text"
                      value={emailContext}
                      onChange={e => setEmailContext(e.target.value)}
                      placeholder="Additional context or references"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <button
                    id="btn-compose-email-submit"
                    disabled={isGeneratingEmail}
                    onClick={handleComposeEmail}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#E0FF25] px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[#cbe61f] transition disabled:opacity-50 shadow-lg"
                  >
                    {isGeneratingEmail ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Firefly Writing Email...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Draft Email with Firefly</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Email Preview & Dispatch */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="rounded-xl border border-[#222] bg-[#111] p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Send className="h-4 w-4 text-[#E0FF25]" />
                    <span>Live Draft Preview</span>
                  </h3>

                  {currentEmailDraft && (
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-copy-email-draft"
                        onClick={() => {
                          navigator.clipboard.writeText(currentEmailDraft.body);
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 2000);
                          onShowToast('Copied email to clipboard', 'success');
                        }}
                        className="flex items-center gap-1.5 rounded bg-[#222] px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white"
                      >
                        {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        id="btn-dispatch-email-bridge"
                        onClick={() => handleDispatchEmail('bridge')}
                        className="flex items-center gap-1.5 rounded bg-[#E0FF25] px-3 py-1 text-[11px] font-black text-black hover:bg-[#cbe61f] transition shadow"
                      >
                        <Laptop className="h-3.5 w-3.5" />
                        <span>Send via Computer</span>
                      </button>
                    </div>
                  )}
                </div>

                {currentEmailDraft ? (
                  <div className="flex-1 flex flex-col rounded-lg border border-[#262626] bg-[#0c0c0c] p-4 text-xs space-y-3">
                    <div className="border-b border-[#222] pb-2 space-y-1">
                      <p className="text-neutral-400">
                        <span className="font-bold text-neutral-300">To:</span> {currentEmailDraft.to}
                      </p>
                      <p className="text-neutral-400">
                        <span className="font-bold text-neutral-300">Subject:</span> {currentEmailDraft.subject}
                      </p>
                    </div>

                    <textarea
                      id="textarea-preview-email-body"
                      value={currentEmailDraft.body}
                      onChange={e => setCurrentEmailDraft({ ...currentEmailDraft, body: e.target.value })}
                      className="w-full flex-1 min-h-[220px] rounded bg-transparent p-1 text-xs text-neutral-200 focus:outline-none resize-none leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                      <span className="text-[11px] text-neutral-500">
                        Tone: <span className="uppercase text-neutral-300">{currentEmailDraft.tone}</span>
                      </span>
                      <button
                        id="btn-send-email-mailto"
                        onClick={() => handleDispatchEmail('mailto')}
                        className="flex items-center gap-1 text-[11px] text-[#E0FF25] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open in Browser Mail</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center rounded-lg border border-dashed border-[#222] p-8 text-center text-neutral-500">
                    <Mail className="h-8 w-8 mb-2 opacity-40 text-[#E0FF25]" />
                    <p className="text-xs font-bold text-neutral-400">No active draft yet</p>
                    <p className="text-[11px] text-neutral-500 max-w-sm mt-1">
                      Fill out the composer on the left or say: "Hey Firefly, write an email to Damone about the release"
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Email History */}
              {emailHistory.length > 0 && (
                <div className="rounded-xl border border-[#222] bg-[#111] p-4">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-2">Recent Dispatches</h4>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {emailHistory.slice(0, 4).map(item => (
                      <div
                        key={item.id}
                        onClick={() => setCurrentEmailDraft(item)}
                        className="flex items-center justify-between rounded border border-[#222] bg-[#0c0c0c] px-3 py-2 text-xs hover:border-[#E0FF25]/40 cursor-pointer transition"
                      >
                        <div className="truncate pr-2">
                          <p className="font-bold text-white truncate">{item.subject}</p>
                          <p className="text-[10px] text-neutral-400 truncate">To: {item.to}</p>
                        </div>
                        <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase shrink-0">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTATION ENGINE */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Doc Generator Configuration */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-xl border border-[#222] bg-[#111] p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#E0FF25]" />
                  <span>Technical Documentation Generator</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Doc Title</label>
                    <input
                      id="input-doc-title"
                      type="text"
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      placeholder="e.g. Sapphire v4 Architecture Specification"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Document Type</label>
                    <select
                      id="select-doc-type"
                      value={docType}
                      onChange={e => setDocType(e.target.value as any)}
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    >
                      <option value="architecture">Architecture Specification</option>
                      <option value="api">API Reference & Contracts</option>
                      <option value="user_guide">User Manual & Ops Guide</option>
                      <option value="sprint_report">Sprint & Release Report</option>
                      <option value="whitepaper">Technical Whitepaper</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Topic & Systems</label>
                    <input
                      id="input-doc-topic"
                      type="text"
                      value={docTopic}
                      onChange={e => setDocTopic(e.target.value)}
                      placeholder="Core components and operational objectives"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Custom Notes / Directives</label>
                    <textarea
                      id="textarea-doc-notes"
                      rows={3}
                      value={docNotes}
                      onChange={e => setDocNotes(e.target.value)}
                      placeholder="Specific requirements or sections to include"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    id="btn-generate-doc-submit"
                    disabled={isGeneratingDoc}
                    onClick={handleGenerateDoc}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#E0FF25] px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[#cbe61f] transition disabled:opacity-50 shadow-lg"
                  >
                    {isGeneratingDoc ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Authoring Documentation...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Publication-Ready Docs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Saved Docs Library */}
              <div className="rounded-xl border border-[#222] bg-[#111] p-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-400 mb-2">Saved Document Library</h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {docsList.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setCurrentDoc(item)}
                      className="flex items-center justify-between rounded border border-[#222] bg-[#0c0c0c] p-2.5 text-xs hover:border-[#E0FF25]/40 cursor-pointer transition"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-white truncate">{item.title}</p>
                        <p className="text-[10px] text-neutral-500 uppercase">{item.docType} • {item.wordCount} words</p>
                      </div>
                      <button
                        id={`btn-dl-doc-${item.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          handleDownloadDoc(item);
                        }}
                        className="text-neutral-400 hover:text-white p-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Markdown Documentation Viewer */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="rounded-xl border border-[#222] bg-[#111] p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-[#222] pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-200">
                      {currentDoc ? currentDoc.title : 'Documentation Workspace'}
                    </h3>
                    <p className="text-[10px] text-neutral-500">
                      {currentDoc ? `${currentDoc.wordCount} words • Markdown & Google Docs Format` : 'Select or generate a document'}
                    </p>
                  </div>

                  {currentDoc && (
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-copy-doc-markdown"
                        onClick={() => {
                          navigator.clipboard.writeText(currentDoc.markdown);
                          setCopiedDoc(true);
                          setTimeout(() => setCopiedDoc(false), 2000);
                          onShowToast('Copied Markdown to clipboard', 'success');
                        }}
                        className="flex items-center gap-1.5 rounded bg-[#222] px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white"
                      >
                        {copiedDoc ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedDoc ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        id="btn-download-doc-file"
                        onClick={() => handleDownloadDoc(currentDoc)}
                        className="flex items-center gap-1.5 rounded bg-[#222] px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>.MD</span>
                      </button>

                      <button
                        id="btn-open-doc-in-gdocs"
                        onClick={() => handleLaunchGoogleDocs('new_doc')}
                        className="flex items-center gap-1.5 rounded bg-[#E0FF25] px-3 py-1 text-[11px] font-black text-black hover:bg-[#cbe61f] transition shadow"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Export to Google Docs</span>
                      </button>
                    </div>
                  )}
                </div>

                {currentDoc ? (
                  <div className="flex-1 overflow-y-auto rounded-lg border border-[#222] bg-[#0c0c0c] p-4 font-mono text-xs text-neutral-300 leading-relaxed max-h-[520px] whitespace-pre-wrap selection:bg-[#E0FF25] selection:text-black">
                    {currentDoc.markdown}
                  </div>
                ) : (
                  <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center rounded-lg border border-dashed border-[#222] p-8 text-center text-neutral-500">
                    <FileCode className="h-8 w-8 mb-2 opacity-40 text-[#E0FF25]" />
                    <p className="text-xs font-bold text-neutral-400">No active documentation loaded</p>
                    <p className="text-[11px] text-neutral-500 max-w-sm mt-1">
                      Configure details on the left or say: "Hey Firefly, write documentation for our neural pipeline"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE DOCS HUB */}
        {activeTab === 'gdocs' && (
          <div className="space-y-6">
            {/* Quick Launch Google Workspace Bar */}
            <div className="rounded-xl border border-[#222] bg-[#111] p-5">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#E0FF25]" />
                  <span>Google Workspace Autonomous Launcher</span>
                </span>
                <span className="text-[11px] text-neutral-400 font-normal">
                  {bridgeStatus.connected ? '⚡ Bridge Linked: Launches in your native OS browser' : '🌐 Web Mode'}
                </span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  id="btn-launch-new-gdoc"
                  onClick={() => handleLaunchGoogleDocs('new_doc')}
                  className="flex flex-col items-start gap-1 rounded-lg border border-[#222] bg-[#0c0c0c] p-3.5 hover:border-[#4285f4] transition text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-white group-hover:text-[#4285f4]">New Google Doc</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-500 group-hover:text-[#4285f4]" />
                  </div>
                  <p className="text-[10px] text-neutral-500">docs.google.com/create</p>
                </button>

                <button
                  id="btn-launch-new-gsheet"
                  onClick={() => handleLaunchGoogleDocs('new_sheet')}
                  className="flex flex-col items-start gap-1 rounded-lg border border-[#222] bg-[#0c0c0c] p-3.5 hover:border-emerald-500 transition text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-white group-hover:text-emerald-400">New Google Sheet</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-500 group-hover:text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-neutral-500">sheets.google.com/create</p>
                </button>

                <button
                  id="btn-launch-new-gslides"
                  onClick={() => handleLaunchGoogleDocs('new_slides')}
                  className="flex flex-col items-start gap-1 rounded-lg border border-[#222] bg-[#0c0c0c] p-3.5 hover:border-amber-500 transition text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-white group-hover:text-amber-400">New Google Slide</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-500 group-hover:text-amber-400" />
                  </div>
                  <p className="text-[10px] text-neutral-500">slides.google.com/create</p>
                </button>

                <button
                  id="btn-launch-search-gdrive"
                  onClick={() => handleLaunchGoogleDocs('search_drive')}
                  className="flex flex-col items-start gap-1 rounded-lg border border-[#222] bg-[#0c0c0c] p-3.5 hover:border-[#E0FF25] transition text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black text-white group-hover:text-[#E0FF25]">Search Google Drive</span>
                    <Search className="h-3.5 w-3.5 text-neutral-500 group-hover:text-[#E0FF25]" />
                  </div>
                  <p className="text-[10px] text-neutral-500">drive.google.com</p>
                </button>
              </div>
            </div>

            {/* Ingestion Form & Synced Docs List */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Ingestion Box */}
              <div className="lg:col-span-5 rounded-xl border border-[#222] bg-[#111] p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#E0FF25]" />
                  <span>Ingest & Index Google Doc</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Google Doc URL / ID</label>
                    <input
                      id="input-gdoc-url"
                      type="text"
                      value={newDocUrl}
                      onChange={e => setNewDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/document/d/.../edit"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Document Title</label>
                    <input
                      id="input-gdoc-title"
                      type="text"
                      value={newDocTitle}
                      onChange={e => setNewDocTitle(e.target.value)}
                      placeholder="e.g. Master Product Architecture Spec"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">Document Content / Excerpt</label>
                    <textarea
                      id="textarea-gdoc-content"
                      rows={4}
                      value={newDocContent}
                      onChange={e => setNewDocContent(e.target.value)}
                      placeholder="Paste text excerpt or notes from your Google Doc to index into memory"
                      className="w-full rounded-lg border border-[#333] bg-[#0c0c0c] px-3 py-2 text-xs text-white focus:border-[#E0FF25] focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    id="btn-sync-gdoc-submit"
                    disabled={isSyncingGdoc}
                    onClick={handleSyncGoogleDoc}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#E0FF25] px-4 py-2.5 text-xs font-black uppercase text-black hover:bg-[#cbe61f] transition disabled:opacity-50 shadow-lg"
                  >
                    {isSyncingGdoc ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Indexing Document...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4" />
                        <span>Index into Firefly Memory</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Indexed Docs Library */}
              <div className="lg:col-span-7 rounded-xl border border-[#222] bg-[#111] p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-300 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Synchronized Google Docs Library</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">{gdocsList.length} indexed documents</span>
                </h3>

                <div className="space-y-3 max-h-[380px] overflow-y-auto">
                  {gdocsList.map(doc => (
                    <div
                      key={doc.id}
                      className="rounded-lg border border-[#222] bg-[#0c0c0c] p-4 text-xs space-y-2 hover:border-[#4285f4]/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white flex items-center gap-2">
                          <span>{doc.title}</span>
                          <span className="rounded bg-[#4285f4]/10 text-[#4285f4] border border-[#4285f4]/30 px-2 py-0.2 text-[9px] font-bold">
                            Google Doc
                          </span>
                        </h4>
                        <button
                          id={`btn-open-gdoc-${doc.id}`}
                          onClick={() => handleLaunchGoogleDocs('open_doc', doc.docUrl)}
                          className="flex items-center gap-1 text-[11px] text-[#4285f4] hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Open Doc</span>
                        </button>
                      </div>

                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        {doc.summary}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-[#1a1a1a]">
                        <span>Synced: {new Date(doc.syncedAt).toLocaleDateString()}</span>
                        <span>{doc.wordCount || 350} words indexed in memory</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
