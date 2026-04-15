import { useState, useEffect } from 'react';
import { api } from '../api';
import { Send, Bot, User, Sparkles, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function AIAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const userTasks = await api.get('/ai-agent/tasks?status=pending');
      setTasks(userTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/ai-agent/chat', {
        message: userMessage,
        session_id: sessionId
      });

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.message,
        data: response
      }]);

      // Reload tasks if any were created
      loadTasks();
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    const actions = {
      'create_load': 'I want to create a new load',
      'find_clients': 'Find me potential clients in California and Texas',
      'get_quote': 'Get me a quote for Los Angeles, CA to Houston, TX',
      'track_shipment': 'Track my recent shipments',
      'daily_ops': 'Run daily AI operations'
    };

    setInput(actions[action]);
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await api.put(`/ai-agent/tasks/${taskId}`, { status: 'completed' });
      loadTasks();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SurfTrans AI Agent</h1>
              <p className="text-sm text-gray-500">Your autonomous freight broker assistant</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chat' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'tasks' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tasks
              {tasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {tasks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'chat' ? (
        <>
          {/* Quick Actions */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Sparkles size={16} className="text-purple-600" />
              <span className="text-sm text-gray-600 mr-2">Quick Actions:</span>
              <button onClick={() => handleQuickAction('create_load')} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 whitespace-nowrap">
                Create Load
              </button>
              <button onClick={() => handleQuickAction('find_clients')} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 whitespace-nowrap">
                Find Clients
              </button>
              <button onClick={() => handleQuickAction('get_quote')} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 whitespace-nowrap">
                Get Quote
              </button>
              <button onClick={() => handleQuickAction('track_shipment')} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 whitespace-nowrap">
                Track Shipment
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="text-white" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to SurfTrans AI</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  I'm your autonomous freight broker assistant. I can create loads, find clients, provide quotes, track shipments, and much more. How can I help you today?
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-3 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-600 to-blue-600'
                  }`}>
                    {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                  </div>
                  <div className={`px-4 py-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : msg.isError 
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Load creation confirmation button */}
                    {msg.data?.type === 'ready_to_create' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
                          Confirm & Create Load
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about freight brokerage..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Tasks Tab */
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Tasks ({tasks.length})</h2>
            
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">All caught up! No pending tasks.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.task_type === 'call_required' ? 'bg-blue-100 text-blue-700' :
                            task.task_type === 'negotiation' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.task_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {task.load_number && <span>Load: {task.load_number}</span>}
                          {task.client_name && <span>Client: {task.client_name}</span>}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Created {new Date(task.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
