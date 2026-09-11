export type PageType = 
  | 'home'
  | 'features'
  | 'pricing'
  | 'sapphire'
  | 'memory'
  | 'claw'
  | 'openclaw'
  | 'capabilities'
  | 'admin'
  | 'settings'
  | 'computer';

export interface PluginItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  on: boolean;
  url?: string;
}

export interface MemoryItem {
  id?: number;
  title: string;
  body: string;
  time: string;
  color?: string;
  memoryType?: 'longTerm' | 'shortTerm';
}

export interface CodeUpdateItem {
  file: string;
  desc: string;
  add: string;
  rem: string;
  time: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  time: string;
  tags?: string[];
}

export interface WorkspaceFile {
  name: string;
  size?: number;
  updatedAt?: string;
}

export interface TerminalLog {
  id: number;
  command: string;
  output: string;
  exitCode: number;
  durationMs: number;
  createdAt: string;
}

export interface DashboardMetrics {
  serverUptime: number;
  workspaceFiles: number;
  memoryUsage: string;
  diskUsage: string;
  nodeVersion: string;
  cpuUsage: string;
  platform: string;
  status: string;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  plan: 'free' | 'pro' | 'enterprise';
  lastSignedIn: string;
}

export interface SavedUserFile {
  id: number;
  name: string;
  content: string;
  fileType: string;
  size: number;
  createdAt: string;
}

export interface StoredConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  tokenCount?: number;
  mode?: 'chat' | 'hands_free_voice' | 'terminal';
  tags?: string[];
}

export type PipelineTriggerType = 'voice_wake' | 'cron' | 'webhook' | 'file_change' | 'event' | 'manual';

export interface PipelineStep {
  id: string;
  title: string;
  type: 'sapphire_prompt' | 'plugin_action' | 'shell_exec' | 'memory_save' | 'file_save' | 'webhook_notify';
  targetPlugin?: string;
  command?: string;
  prompt?: string;
  memoryKey?: string;
  fileName?: string;
  config?: Record<string, any>;
}

export interface OpenClawPipeline {
  id: string;
  name: string;
  description: string;
  triggerType: PipelineTriggerType;
  triggerConfig: string;
  steps: PipelineStep[];
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRunAt?: string;
  runCount: number;
  enabled: boolean;
  tags?: string[];
  savedOutputLocation?: string;
}

export interface PipelineExecutionRun {
  id: string;
  pipelineId: string;
  pipelineName: string;
  status: 'running' | 'success' | 'error';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  stepLogs: Array<{
    stepId: string;
    stepTitle: string;
    status: 'pending' | 'running' | 'success' | 'error';
    output: string;
    durationMs: number;
    savedArtifact?: string;
  }>;
  generatedFiles?: string[];
}

export interface PluginConnector {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  category: 'blockchain' | 'iot' | 'infrastructure' | 'voice' | 'creative' | 'developer';
  status: 'connected' | 'idle' | 'standby' | 'error';
  lastTested?: string;
  supportedActions: Array<{
    id: string;
    name: string;
    desc: string;
    samplePayload: Record<string, any>;
  }>;
}

// ----------------------------------------------------
// SIX 686 GOVERNANCE SYSTEM TYPES
// ----------------------------------------------------
export type AgentId = 'neural-core' | 'sapphire' | 'openclaw' | string;

export type ActionType =
  | 'read'
  | 'write'
  | 'execute'
  | 'delete'
  | 'network'
  | 'git'
  | 'deploy'
  | 'system';

export type GovernanceDecision = 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';

export interface AgentAction {
  id?: string;
  agentId: AgentId;
  type: ActionType;
  capability: string;
  target?: string;
  description: string;
  metadata?: Record<string, unknown>;
  requestedAt?: string;
}

export interface RiskAssessment {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
}

export interface GovernanceResult {
  action: AgentAction;
  risk: RiskAssessment;
  decision: GovernanceDecision;
  approvalId?: string;
  reason: string;
}

export interface GovernanceAuditEntry {
  id: string;
  timestamp: string;
  agentId: AgentId;
  actionId: string;
  capability: string;
  target?: string;
  riskScore: number;
  decision: GovernanceDecision;
  result?: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING';
  message: string;
}

export interface GovernanceApprovalRequest {
  id: string;
  actionId?: string;
  action?: AgentAction;
  risk?: RiskAssessment;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface KillSwitchStatus {
  active: boolean;
  stoppedAt: string | null;
  stoppedBy: string | null;
}

// ----------------------------------------------------
// SAPPHIRE SPEECH & WAKE WORD PIPELINE TYPES
// ----------------------------------------------------
export type VoiceListeningState = 'inactive' | 'standby' | 'listening' | 'processing' | 'speaking' | 'error';

export interface WakeWordConfig {
  wakeWords: string[];
  autoStartOnMount: boolean;
  continuousMode: boolean;
  audioGain: number;
  silenceThresholdMs: number;
  enableGeminiSTTFallback: boolean;
  enableDuplexEchoGate: boolean;
}

export interface VoiceStreamEvent {
  type: 'wake_detected' | 'speech_interim' | 'speech_final' | 'command_routed' | 'tts_started' | 'tts_finished' | 'error';
  wakeWord?: string;
  transcript?: string;
  confidence?: number;
  routedTo?: 'gemini_flash' | 'neurocore' | 'openclaw_pipeline' | 'terminal';
  payload?: any;
  timestamp: string;
}

export interface VoicePipelineStatus {
  status: 'online' | 'standby' | 'error';
  autoListening: boolean;
  wakeWords: string[];
  activeEngine: string;
  sampleRate: string;
  duplexEchoGateActive: boolean;
  geminiSTTReady: boolean;
  supportedIntents: string[];
}

// ----------------------------------------------------
// FIREFLY LOCAL COMPUTER BRIDGE & AUTONOMOUS AGENT TYPES
// ----------------------------------------------------
export interface LocalComputerInfo {
  platform: string;
  arch: string;
  hostname: string;
  username: string;
  homeDir: string;
  cpuCount: number;
  freeMemMb: number;
  totalMemMb: number;
  uptimeSeconds: number;
  nodeVersion?: string;
  pythonVersion?: string;
}

export interface FireflyBridgeStatus {
  connected: boolean;
  url: string;
  agentName: string;
  mode: 'say_okay_gate' | 'full_autonomous';
  lastPing?: string;
  computerInfo?: LocalComputerInfo;
  error?: string;
}

export interface FireflyComputerCommand {
  id: string;
  command: string;
  cwd?: string;
  status: 'pending_approval' | 'executing' | 'success' | 'failed' | 'rejected';
  requiresOkay?: boolean;
  approved?: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs?: number;
  timestamp: string;
  explanation?: string;
}

export interface EmailDraft {
  id: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  tone: 'professional' | 'technical' | 'concise' | 'warm' | 'urgent';
  status: 'draft' | 'sent' | 'queued';
  createdAt: string;
  sentAt?: string;
}

export interface DocumentationItem {
  id: string;
  title: string;
  docType: 'architecture' | 'api' | 'user_guide' | 'sprint_report' | 'whitepaper' | 'readme';
  markdown: string;
  wordCount: number;
  createdAt: string;
  tags: string[];
}

export interface GoogleDocItem {
  id: string;
  title: string;
  docUrl: string;
  docId?: string;
  summary: string;
  wordCount?: number;
  syncedAt: string;
  status: 'synced' | 'linked' | 'pending';
}




