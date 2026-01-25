/**
 * Template data structure for ADK Studio v2.0
 * 
 * Provides 8-12 curated agent workflow templates covering:
 * - Agent teams
 * - Eval loops
 * - Tool-heavy workflows
 * - Realtime agents
 * 
 * Requirements: 6.1, 6.2
 */

import type { AgentSchema } from '../../types/project';

/**
 * Template category for filtering
 */
export type TemplateCategory = 'basic' | 'advanced' | 'realtime' | 'tools' | 'teams';

/**
 * Template data structure
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  icon: string;
  /** Short description */
  description: string;
  /** Category for filtering */
  category: TemplateCategory;
  /** Agent definitions */
  agents: Record<string, AgentSchema>;
  /** Edge connections */
  edges: Array<{ from: string; to: string }>;
  /** Preview image path (optional) */
  previewImage?: string;
}

/**
 * Curated templates for ADK Studio
 * 
 * Includes templates for:
 * - Basic: Simple chat, research pipeline
 * - Advanced: Content refiner (loop), parallel analyzer, support router
 * - Tools: Web researcher, code assistant, data analyst
 * - Teams: Agent teams with multiple specialized agents
 * - Realtime: Voice/audio agents
 */
export const TEMPLATES: Template[] = [
  // ============================================
  // BASIC TEMPLATES
  // ============================================
  {
    id: 'simple_chat',
    name: 'Simple Chat Agent',
    icon: '💬',
    description: 'A basic conversational agent for general Q&A',
    category: 'basic',
    agents: {
      'chat_agent': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a helpful, friendly assistant. Answer questions clearly and concisely. Be conversational but informative.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'chat_agent' },
      { from: 'chat_agent', to: 'END' },
    ]
  },
  {
    id: 'research_pipeline',
    name: 'Research Pipeline',
    icon: '🔍',
    description: 'Sequential workflow: Researcher → Summarizer',
    category: 'basic',
    agents: {
      'researcher': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a research specialist. Given a topic, search for comprehensive information using Google Search. Gather key facts, statistics, recent developments, and expert opinions. Present your findings in a structured format.',
        tools: ['google_search'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'summarizer': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are an expert summarizer. Take the research findings and create a clear, concise summary with: 1) Key takeaways (3-5 bullet points), 2) Main findings, 3) Conclusions. Make it easy to understand for a general audience.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'research_pipeline': {
        type: 'sequential',
        instruction: '',
        tools: [],
        sub_agents: ['researcher', 'summarizer'],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'research_pipeline' },
      { from: 'research_pipeline', to: 'END' },
    ]
  },

  // ============================================
  // ADVANCED TEMPLATES
  // ============================================
  {
    id: 'content_refiner',
    name: 'Content Refiner',
    icon: '✨',
    description: 'Loop agent that iteratively improves content quality',
    category: 'advanced',
    agents: {
      'improver': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a content editor. Review the text and improve it by: fixing grammar and spelling errors, enhancing clarity and flow, improving word choice, and strengthening the overall structure. Output the improved version.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'reviewer': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a quality reviewer. Evaluate the content for: clarity, grammar, flow, and completeness. If the content is polished and ready (score 8/10 or higher), call exit_loop. Otherwise, briefly note what still needs improvement and let the improver continue.',
        tools: ['exit_loop'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'content_refiner': {
        type: 'loop',
        instruction: '',
        tools: [],
        sub_agents: ['improver', 'reviewer'],
        position: { x: 250, y: 150 },
        max_iterations: 3,
      }
    },
    edges: [
      { from: 'START', to: 'content_refiner' },
      { from: 'content_refiner', to: 'END' },
    ]
  },
  {
    id: 'parallel_analyzer',
    name: 'Parallel Analyzer',
    icon: '⚡',
    description: 'Run multiple analyses concurrently for speed',
    category: 'advanced',
    agents: {
      'sentiment_analyzer': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'Analyze the sentiment of the provided text. Identify: 1) Overall sentiment (positive/negative/neutral with confidence %), 2) Emotional tones present (joy, anger, sadness, etc.), 3) Key phrases that indicate sentiment. Format as a brief report.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'entity_extractor': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'Extract key entities from the text. Identify and categorize: 1) People (names, roles), 2) Organizations (companies, institutions), 3) Locations (cities, countries), 4) Dates and times, 5) Key topics/concepts. Format as a structured list.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'parallel_analyzer': {
        type: 'parallel',
        instruction: '',
        tools: [],
        sub_agents: ['sentiment_analyzer', 'entity_extractor'],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'parallel_analyzer' },
      { from: 'parallel_analyzer', to: 'END' },
    ]
  },
  {
    id: 'support_router',
    name: 'Support Router',
    icon: '🔀',
    description: 'Route requests to specialized support agents',
    category: 'advanced',
    agents: {
      'router': {
        type: 'router',
        model: 'gemini-2.0-flash',
        instruction: 'Classify the user request into one category: "technical" for coding, bugs, API issues, or technical problems; "billing" for payments, subscriptions, refunds, or account charges; "general" for all other questions. Respond with just the category word.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 100 },
        routes: [
          { condition: 'technical', target: 'tech_support' },
          { condition: 'billing', target: 'billing_support' },
          { condition: 'general', target: 'general_support' },
        ],
      },
      'tech_support': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a senior technical support engineer. Help users with coding issues, bugs, API problems, and technical troubleshooting. Ask clarifying questions if needed. Provide code examples when helpful. Be patient and thorough.',
        tools: [],
        sub_agents: [],
        position: { x: 100, y: 350 },
      },
      'billing_support': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a billing specialist. Help users with payment issues, subscription questions, refund requests, and account billing inquiries. Be empathetic and solution-oriented. Explain charges clearly.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 350 },
      },
      'general_support': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a friendly general support agent. Help users with general questions, product information, feature requests, and any inquiries that don\'t fit technical or billing categories. Be helpful and personable.',
        tools: [],
        sub_agents: [],
        position: { x: 400, y: 350 },
      }
    },
    edges: [
      { from: 'START', to: 'router' },
      { from: 'router', to: 'tech_support' },
      { from: 'router', to: 'billing_support' },
      { from: 'router', to: 'general_support' },
      { from: 'tech_support', to: 'END' },
      { from: 'billing_support', to: 'END' },
      { from: 'general_support', to: 'END' },
    ]
  },

  // ============================================
  // TOOL-HEAVY TEMPLATES
  // ============================================
  {
    id: 'web_researcher',
    name: 'Web Researcher',
    icon: '🌐',
    description: 'Agent with browser capabilities for web research',
    category: 'tools',
    agents: {
      'web_agent': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a web research assistant with browser capabilities. When asked a question: 1) Navigate to relevant websites to find accurate, up-to-date information, 2) Read and extract key content from pages, 3) Synthesize findings into a clear answer with sources. Always cite your sources.',
        tools: ['browser'],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'web_agent' },
      { from: 'web_agent', to: 'END' },
    ]
  },
  {
    id: 'code_assistant',
    name: 'Code Assistant',
    icon: '💻',
    description: 'Programming assistant with code execution tools',
    category: 'tools',
    agents: {
      'code_agent': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are an expert programming assistant. Help users with: 1) Writing clean, efficient code, 2) Debugging issues, 3) Explaining concepts, 4) Code reviews. Use the code execution tool to test and validate code when helpful. Support multiple languages including Python, JavaScript, Rust, and more.',
        tools: ['code_execution'],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'code_agent' },
      { from: 'code_agent', to: 'END' },
    ]
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    icon: '📊',
    description: 'Analyze data with search and computation tools',
    category: 'tools',
    agents: {
      'analyst': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a data analyst. Help users understand and analyze data by: 1) Searching for relevant datasets and statistics, 2) Performing calculations and analysis, 3) Creating clear visualizations and summaries, 4) Providing actionable insights. Use available tools to gather and process data.',
        tools: ['google_search', 'code_execution'],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'analyst' },
      { from: 'analyst', to: 'END' },
    ]
  },

  // ============================================
  // AGENT TEAMS TEMPLATES
  // ============================================
  {
    id: 'writing_team',
    name: 'Writing Team',
    icon: '✍️',
    description: 'Collaborative team: Writer → Editor → Fact-Checker',
    category: 'teams',
    agents: {
      'writer': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a creative writer. Given a topic, write engaging, well-structured content. Focus on clarity, flow, and reader engagement. Include relevant examples and explanations.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'editor': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a professional editor. Review the content for: grammar, style, clarity, and structure. Make improvements while preserving the author\'s voice. Suggest changes and explain your reasoning.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'fact_checker': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a fact-checker. Verify all claims, statistics, and facts in the content. Use search to confirm accuracy. Flag any questionable statements and provide corrections with sources.',
        tools: ['google_search'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'writing_team': {
        type: 'sequential',
        instruction: '',
        tools: [],
        sub_agents: ['writer', 'editor', 'fact_checker'],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'writing_team' },
      { from: 'writing_team', to: 'END' },
    ]
  },
  {
    id: 'eval_loop',
    name: 'Evaluation Loop',
    icon: '🔄',
    description: 'Generate and evaluate responses iteratively',
    category: 'teams',
    agents: {
      'generator': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a response generator. Create high-quality, comprehensive responses to user queries. Consider multiple perspectives and provide thorough explanations.',
        tools: [],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'evaluator': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a response evaluator. Score the response on: accuracy (1-10), completeness (1-10), clarity (1-10). If average score >= 8, call exit_loop. Otherwise, provide specific feedback for improvement.',
        tools: ['exit_loop'],
        sub_agents: [],
        position: { x: 0, y: 0 },
      },
      'eval_loop': {
        type: 'loop',
        instruction: '',
        tools: [],
        sub_agents: ['generator', 'evaluator'],
        position: { x: 250, y: 150 },
        max_iterations: 3,
      }
    },
    edges: [
      { from: 'START', to: 'eval_loop' },
      { from: 'eval_loop', to: 'END' },
    ]
  },

  // ============================================
  // REALTIME TEMPLATES
  // ============================================
  {
    id: 'voice_assistant',
    name: 'Voice Assistant',
    icon: '🎙️',
    description: 'Real-time voice-enabled conversational agent',
    category: 'realtime',
    agents: {
      'voice_agent': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a voice assistant. Respond naturally and conversationally. Keep responses concise (1-2 sentences when possible) for smooth voice interaction. Be helpful, friendly, and responsive.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'voice_agent' },
      { from: 'voice_agent', to: 'END' },
    ]
  },
  {
    id: 'realtime_translator',
    name: 'Realtime Translator',
    icon: '🌍',
    description: 'Live translation agent for multilingual conversations',
    category: 'realtime',
    agents: {
      'translator': {
        type: 'llm',
        model: 'gemini-2.0-flash',
        instruction: 'You are a real-time translator. Detect the input language and translate to the target language (default: English). Preserve tone, context, and nuance. For voice input, respond quickly with natural translations.',
        tools: [],
        sub_agents: [],
        position: { x: 250, y: 150 },
      }
    },
    edges: [
      { from: 'START', to: 'translator' },
      { from: 'translator', to: 'END' },
    ]
  },
];

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category: TemplateCategory | 'all'): Template[] {
  if (category === 'all') {
    return TEMPLATES;
  }
  return TEMPLATES.filter(t => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}

/**
 * Get all unique categories
 */
export function getCategories(): TemplateCategory[] {
  return ['basic', 'advanced', 'tools', 'teams', 'realtime'];
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<TemplateCategory | 'all', string> = {
  all: 'All Templates',
  basic: 'Basic',
  advanced: 'Advanced',
  tools: 'Tool-Heavy',
  teams: 'Agent Teams',
  realtime: 'Realtime',
};
