import { useState, useEffect } from 'react';
import { ComponentRenderer } from './adk-ui-renderer/Renderer';
import { convertA2UIComponent } from './adk-ui-renderer/a2ui-converter';
import type { Component } from './adk-ui-renderer/types';
import './App.css';

interface Surface {
  surfaceId: string;
  components: Component[];
  dataModel: Record<string, unknown>;
}

interface Example {
  id: string;
  name: string;
  description: string;
  port: number;
  prompts: string[];
}

const EXAMPLES: Example[] = [
  { 
    id: 'ui_demo', 
    name: 'UI Demo', 
    description: 'Basic A2UI demo', 
    port: 8080,
    prompts: [
      'Show me a welcome screen',
      'Create a user profile card',
      'Build a settings form',
    ]
  },
  { 
    id: 'ui_working_support', 
    name: 'Support Intake', 
    description: 'Support ticket system', 
    port: 8081,
    prompts: [
      'Open a support ticket',
      'Report a bug in the billing portal',
      'My app keeps crashing on launch',
    ]
  },
  { 
    id: 'ui_working_appointment', 
    name: 'Appointments', 
    description: 'Appointment booking', 
    port: 8082,
    prompts: [
      'Book a dentist appointment',
      'Show available services',
      'Schedule a follow-up for next week',
    ]
  },
  { 
    id: 'ui_working_events', 
    name: 'Events', 
    description: 'Event RSVP system', 
    port: 8083,
    prompts: [
      'RSVP for the product launch',
      'Show event agenda',
      'Register 2 guests with vegetarian meals',
    ]
  },
  { 
    id: 'ui_working_facilities', 
    name: 'Facilities', 
    description: 'Work order system', 
    port: 8084,
    prompts: [
      'Report a leaking pipe on floor 3',
      'Create a maintenance work order',
      'Request HVAC repair in conference room B',
    ]
  },
  { 
    id: 'ui_working_inventory', 
    name: 'Inventory', 
    description: 'Restock requests', 
    port: 8085,
    prompts: [
      'Request restock for SKU A-102',
      'Show low-stock items',
      'Create purchase request for 200 units',
    ]
  },
];

function App() {
  const [surface, setSurface] = useState<Surface | null>(null);
  const [selectedExample, setSelectedExample] = useState<Example>(EXAMPLES[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setSurface(null);

    try {
      const baseUrl = `http://localhost:${selectedExample.port}`;
      
      // Create new session if needed
      let sid = sessionId;
      if (!sid) {
        const sessionRes = await fetch(`${baseUrl}/api/apps/${selectedExample.id}/users/user1/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: {} }),
        });
        if (!sessionRes.ok) {
          console.error('Failed to create session');
          setIsLoading(false);
          return;
        }
        const session = await sessionRes.json();
        sid = session.id;
        setSessionId(sid);
      }

      setIsConnected(true);

      // Send message via POST
      const response = await fetch(`${baseUrl}/api/run/${selectedExample.id}/user1/${sid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_message: message }),
      });

      if (!response.ok || !response.body) {
        console.error('Failed to connect');
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const eventData = line.slice(6).trim();
          if (!eventData || eventData === ':keep-alive') continue;

          try {
            const evt = JSON.parse(eventData);

            if (evt.content?.parts) {
              for (const part of evt.content.parts) {
                if (part.functionResponse?.name === 'render_screen') {
                  const response = part.functionResponse.response;
                  if (response.components) {
                    const componentsArray = typeof response.components === 'string' 
                      ? JSON.parse(response.components)
                      : response.components;
                    
                    const componentMap = new Map<string, any>();
                    componentsArray.forEach((comp: any) => {
                      const converted = convertA2UIComponent(comp);
                      if (converted) {
                        componentMap.set(converted.id, converted);
                      }
                    });
                    
                    const resolveChildren = (comp: any): any => {
                      if (comp.children && Array.isArray(comp.children)) {
                        return {
                          ...comp,
                          children: comp.children.map((childId: string) => {
                            const child = componentMap.get(childId);
                            return child ? resolveChildren(child) : null;
                          }).filter(Boolean)
                        };
                      }
                      return comp;
                    };
                    
                    const root = componentMap.get('root');
                    if (root) {
                      const resolvedRoot = resolveChildren(root);
                      setSurface({
                        surfaceId: response.surface_id || 'main',
                        components: [resolvedRoot],
                        dataModel: response.data_model || {},
                      });
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset session when example changes
  useEffect(() => {
    setSessionId(null);
    setSurface(null);
    setIsConnected(false);
  }, [selectedExample]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              A2UI Examples
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedExample.description}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedExample.id}
              onChange={(e) => {
                const example = EXAMPLES.find(ex => ex.id === e.target.value);
                if (example) setSelectedExample(example);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {EXAMPLES.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? 'Loading...' : isConnected ? 'Ready' : 'Select a prompt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prompts Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Prompts
              </h2>
              <div className="space-y-2">
                {selectedExample.prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-gray-900 dark:text-white">{prompt}</span>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Prompt
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        sendMessage(customPrompt);
                        setCustomPrompt('');
                      }
                    }}
                    placeholder="Type your prompt..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => {
                      sendMessage(customPrompt);
                      setCustomPrompt('');
                    }}
                    disabled={isLoading || !customPrompt.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* UI Display */}
          <div className="lg:col-span-2">
            {surface && surface.components.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                {surface.components.map((component, index) => (
                  <ComponentRenderer key={index} component={component} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Generating UI...</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">👈</div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a prompt from the left panel to generate UI
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
