import { VoiceListeningState, WakeWordConfig, VoiceStreamEvent, PageType } from '../types';

// Default Wake Word & Speech Pipeline Configuration
export const DEFAULT_WAKE_CONFIG: WakeWordConfig = {
  wakeWords: [
    'hey firefly',
    'firefly',
    'hi firefly',
    'hello firefly',
    'ok firefly',
    'okay firefly',
    'hey sapphire',
    'sapphire',
    'hi sapphire',
    'hello sapphire',
    'ok sapphire',
    'okay sapphire',
    'hey safire',
    'hey saphire'
  ],
  autoStartOnMount: true,
  continuousMode: true,
  audioGain: 1.0,
  silenceThresholdMs: 1300,
  enableGeminiSTTFallback: true,
  enableDuplexEchoGate: true
};

export interface SpokenRouteResult {
  isWakeWord: boolean;
  wakeWordMatched?: string;
  isContinuousCommand: boolean;
  intent: 
    | 'wake_ping' 
    | 'continuous_start' 
    | 'continuous_stop' 
    | 'page_turn'
    | 'ui_click'
    | 'computer_exec'
    | 'say_okay_approval'
    | 'write_email'
    | 'create_doc'
    | 'google_docs'
    | 'openclaw_exec' 
    | 'query' 
    | 'ignore';
  cleanQuery: string;
  targetPage?: PageType;
  clickTarget?: string;
  computerCommand?: string;
  emailTarget?: { to?: string; subject?: string; context?: string };
  docTarget?: { title?: string; docType?: string; topic?: string };
  gdocsAction?: 'open' | 'new' | 'sync' | 'search';
  suggestedAction?: string;
}

/**
 * Firefly & Sapphire Voice Speech Router
 * Decodes raw transcript, strips wake words, categorizes commands, and dispatches to appropriate engine pipeline
 */
export function routeSpokenSpeech(
  rawTranscript: string,
  isContinuousMode: boolean,
  config: WakeWordConfig = DEFAULT_WAKE_CONFIG
): SpokenRouteResult {
  const trimmed = (rawTranscript || '').trim();
  if (!trimmed) {
    return {
      isWakeWord: false,
      isContinuousCommand: false,
      intent: 'ignore',
      cleanQuery: ''
    };
  }

  const lower = trimmed.toLowerCase();

  // Check wake word matches
  let matchedWakeWord: string | undefined = undefined;
  for (const w of config.wakeWords) {
    const regex = new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(lower)) {
      matchedWakeWord = w;
      break;
    }
  }

  const hasWakeWord = !!matchedWakeWord;

  // Clean out the wake word prefix/affix from the command
  let strippedQuery = trimmed;
  if (hasWakeWord) {
    strippedQuery = trimmed.replace(
      /^(.*?)(hey\s+firefly|firefly|hi\s+firefly|hello\s+firefly|okay\s+firefly|ok\s+firefly|hey\s+sapphire|sapphire|hi\s+sapphire|hello\s+sapphire|okay\s+sapphire|ok\s+sapphire|hey\s+safire|hey\s+saphire)[,\s:]*/i,
      ''
    ).trim();
  }

  const lowerStripped = strippedQuery.toLowerCase();

  // Intent 1: "Say Okay" / Voice Handshake for Computer Autonomy Authorization
  if (
    lowerStripped === 'say okay' ||
    lowerStripped === 'okay' ||
    lowerStripped === 'ok' ||
    lowerStripped === 'i say okay' ||
    lowerStripped === 'approve' ||
    lowerStripped === 'authorize' ||
    lowerStripped === 'confirm' ||
    lowerStripped === 'go ahead' ||
    lowerStripped === 'yes okay' ||
    lowerStripped === 'firefly okay'
  ) {
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'say_okay_approval',
      cleanQuery: strippedQuery,
      suggestedAction: 'authorize_computer_command'
    };
  }

  // Intent 2: Stop continuous mode
  if (
    lowerStripped === 'stop listening' ||
    lowerStripped === 'stop conversation' ||
    lowerStripped === 'exit conversation mode' ||
    lowerStripped === 'pause voice' ||
    lowerStripped === 'turn off continuous mode' ||
    lowerStripped === 'mute microphone' ||
    lowerStripped === 'sleep'
  ) {
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: true,
      intent: 'continuous_stop',
      cleanQuery: strippedQuery,
      suggestedAction: 'turn_off_continuous_mode'
    };
  }

  // Intent 3: Start continuous conversation mode
  if (
    lowerStripped === 'start conversation mode' ||
    lowerStripped === 'start continuous mode' ||
    lowerStripped === 'enable hands free' ||
    lowerStripped === 'lets talk' ||
    lowerStripped === "let's talk" ||
    lowerStripped === 'listen continuously' ||
    lowerStripped === 'wake up'
  ) {
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: true,
      intent: 'continuous_start',
      cleanQuery: strippedQuery,
      suggestedAction: 'turn_on_continuous_mode'
    };
  }

  // Intent 4: Page Turn / Navigation ("Turn to...", "Go to...", "Open [page]...")
  const pageTurnMatch = lowerStripped.match(/^(?:turn\s+to|turn\s+page\s+to|go\s+to|navigate\s+to|open|switch\s+to|show\s+me)\s+(?:the\s+)?(?:page\s+)?(.+)/i);
  if (pageTurnMatch) {
    const rawTarget = pageTurnMatch[1].trim().toLowerCase();
    let targetPage: PageType | null = null;

    if (rawTarget.includes('openclaw') || rawTarget.includes('claw') || rawTarget.includes('terminal')) {
      targetPage = 'openclaw';
    } else if (rawTarget.includes('sapphire') || rawTarget.includes('chat') || rawTarget.includes('assistant')) {
      targetPage = 'sapphire';
    } else if (rawTarget.includes('home') || rawTarget.includes('main') || rawTarget.includes('dashboard')) {
      targetPage = 'home';
    } else if (rawTarget.includes('memory') || rawTarget.includes('brain') || rawTarget.includes('memories')) {
      targetPage = 'memory';
    } else if (rawTarget.includes('capabilities') || rawTarget.includes('plugins') || rawTarget.includes('connectors')) {
      targetPage = 'capabilities';
    } else if (rawTarget.includes('pricing') || rawTarget.includes('plans')) {
      targetPage = 'pricing';
    } else if (rawTarget.includes('features') || rawTarget.includes('showcase')) {
      targetPage = 'features';
    } else if (rawTarget.includes('admin') || rawTarget.includes('governance')) {
      targetPage = 'admin';
    } else if (rawTarget.includes('settings') || rawTarget.includes('config')) {
      targetPage = 'settings';
    } else if (rawTarget.includes('computer') || rawTarget.includes('bridge') || rawTarget.includes('my computer') || rawTarget.includes('autonomy')) {
      targetPage = 'computer';
    }

    if (targetPage) {
      return {
        isWakeWord: hasWakeWord,
        wakeWordMatched: matchedWakeWord,
        isContinuousCommand: isContinuousMode,
        intent: 'page_turn',
        cleanQuery: strippedQuery,
        targetPage,
        suggestedAction: `navigate_to_${targetPage}`
      };
    }
  }

  // Intent 5: Autonomous UI Click ("Click [button/element]")
  const clickMatch = lowerStripped.match(/^click\s+(?:on\s+)?(?:the\s+)?(.+)/i);
  if (clickMatch) {
    const clickTarget = clickMatch[1].trim();
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'ui_click',
      cleanQuery: strippedQuery,
      clickTarget,
      suggestedAction: `click_${clickTarget}`
    };
  }

  // Intent 6: Local Computer Command Execution ("run on my computer [command]", "open on my computer [app]")
  const compExecMatch = lowerStripped.match(/^(?:run\s+on\s+my\s+computer|run\s+on\s+computer|computer\s+run|execute\s+on\s+my\s+computer|open\s+on\s+my\s+computer)\s+(.+)/i);
  if (compExecMatch) {
    const cmd = compExecMatch[1].trim();
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'computer_exec',
      cleanQuery: strippedQuery,
      computerCommand: cmd,
      suggestedAction: `execute_computer_${cmd}`
    };
  }

  // Intent 6B: Email Assistant ("Write an email to...", "Draft email...", "Send email...")
  const emailMatch = lowerStripped.match(/^(?:write|compose|send|draft)\s+(?:an?\s+)?email(?:\s+to\s+([^\s]+(?:@[^\s]+)?))?(?:\s+(?:about|regarding|on)\s+(.+))?/i);
  if (emailMatch || lowerStripped.startsWith('email ') || lowerStripped === 'write email') {
    const to = emailMatch ? emailMatch[1] : undefined;
    const subject = emailMatch ? emailMatch[2] : undefined;
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'write_email',
      cleanQuery: strippedQuery,
      emailTarget: { to, subject, context: strippedQuery },
      suggestedAction: 'compose_email_assistant'
    };
  }

  // Intent 6C: Documentation Assistant ("Write documentation for...", "Create docs on...")
  const docMatch = lowerStripped.match(/^(?:write|create|generate|draft)\s+(?:technical\s+)?(?:documentation|docs|doc|spec|specification)(?:\s+(?:for|on|about)\s+(.+))?/i);
  if (docMatch || lowerStripped.startsWith('generate docs') || lowerStripped === 'write documentation') {
    const topic = docMatch ? docMatch[1] : 'System Architecture';
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'create_doc',
      cleanQuery: strippedQuery,
      docTarget: { topic, title: `${topic} Specification`, docType: 'architecture' },
      suggestedAction: 'generate_technical_docs'
    };
  }

  // Intent 6D: Google Docs & Workspace ("Open Google Docs", "Access my Google Docs", "Search Google Drive")
  const gdocsMatch = lowerStripped.match(/(?:google\s+docs|google\s+doc|google\s+drive|google\s+sheets|my\s+docs|open\s+docs)/i);
  if (gdocsMatch) {
    let action: 'open' | 'new' | 'sync' | 'search' = 'open';
    if (lowerStripped.includes('new') || lowerStripped.includes('create')) action = 'new';
    else if (lowerStripped.includes('sync')) action = 'sync';
    else if (lowerStripped.includes('search')) action = 'search';

    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'google_docs',
      cleanQuery: strippedQuery,
      gdocsAction: action,
      suggestedAction: `google_docs_${action}`
    };
  }

  // Intent 7: Just the wake word was spoken with no trailing command (e.g. "Hey Firefly", "Hey Sapphire")
  if (hasWakeWord && !strippedQuery) {
    return {
      isWakeWord: true,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: false,
      intent: 'wake_ping',
      cleanQuery: '',
      suggestedAction: 'reply_wake_acknowledgement'
    };
  }

  // Intent 8: In standby mode with no wake word spoken
  if (!isContinuousMode && !hasWakeWord) {
    return {
      isWakeWord: false,
      isContinuousCommand: false,
      intent: 'ignore',
      cleanQuery: ''
    };
  }

  // Intent 9: Direct OpenClaw terminal or system command
  if (
    lowerStripped.startsWith('openclaw') ||
    lowerStripped === 'status' ||
    lowerStripped === 'ls' ||
    lowerStripped === 'whoami' ||
    lowerStripped === 'git status' ||
    lowerStripped.startsWith('run pipeline') ||
    lowerStripped === 'ping sapphire' ||
    lowerStripped === 'ping firefly'
  ) {
    return {
      isWakeWord: hasWakeWord,
      wakeWordMatched: matchedWakeWord,
      isContinuousCommand: isContinuousMode,
      intent: 'openclaw_exec',
      cleanQuery: strippedQuery,
      suggestedAction: 'execute_openclaw_command'
    };
  }

  // Intent 10: General conversational query / coding task / assistant prompt
  return {
    isWakeWord: hasWakeWord,
    wakeWordMatched: matchedWakeWord,
    isContinuousCommand: isContinuousMode,
    intent: 'query',
    cleanQuery: strippedQuery || trimmed
  };
}
