// Chatbot.js - React component for the AI course assistant

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '.static/Chatbot.css';


const Chatbot = ({ courseId, isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const chatContainerRef = useRef(null);

  // Fetch chat history on component mount
  useEffect(() => {
    if (isOpen && !initialized) {
      fetchChatHistory();
      setInitialized(true);
    }
  }, [isOpen, initialized]);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      const response = await axios.get(`/api/chatbot/history${courseId ? `?courseId=${courseId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.messages.length === 0) {
        // Add welcome message if no history
        setMessages([{
          role: 'assistant',
          content: courseId 
            ? 'Hello! I\'m your course assistant. Ask me anything about this course and I\'ll do my best to help you!'
            : 'Hello! I\'m LearnSmart\'s AI assistant. How can I help you with your studies today?'
        }]);
      } else {
        setMessages(response.data.messages);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setLoading(false);
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: input, timestamp: new Date() }]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to use the chatbot');
        return;
      }

      const response = await axios.post('/api/chatbot', 
        { message: userInput, courseId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Update with AI response
      setMessages(response.data.chatHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-wrapper">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h3>{courseId ? 'Course Assistant' : 'LearnSmart AI'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
              <div className="message-content">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              {msg.timestamp && (
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message assistant-message">
              <div className="loading-indicator">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
        </div>

        <form className="chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;