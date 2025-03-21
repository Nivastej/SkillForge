// server.js - Main backend file for LearnSmart EdTech platform

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learnsmart', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, required: true },
  modules: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    resources: [{ type: String }],
    quiz: [{
      question: { type: String },
      options: [{ type: String }],
      correctAnswer: { type: Number }
    }]
  }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String }
  }],
  category: { type: String, required: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const chatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication required' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
});

// Create a new course (teacher or admin only)
app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    // Verify user is a teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only teachers or admins can create courses' });
    }

    const {
      title,
      description,
      price,
      modules,
      category,
      level
    } = req.body;

    const newCourse = new Course({
      title,
      description,
      instructor: req.user.id,
      price,
      modules,
      category,
      level
    });

    await newCourse.save();

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({ message: 'Server error while creating course' });
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    // Support filtering
    const { category, level, search } = req.query;

    let query = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .select('title description price category level ratings');

    res.status(200).json(courses);
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ message: 'Server error while fetching courses' });
  }
});

// Get course details
app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('ratings.user', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error('Course details error:', error);
    res.status(500).json({ message: 'Server error while fetching course details' });
  }
});

// Enroll in a course
app.post('/api/courses/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const user = await User.findById(userId);
    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Update user and course
    await User.findByIdAndUpdate(userId, {
      $push: { enrolledCourses: courseId }
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { students: userId }
    });

    res.status(200).json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error during course enrollment' });
  }
});

// Rate and review a course
app.post('/api/courses/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const courseId = req.params.id;
    const userId = req.user.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled
    const user = await User.findById(userId);
    if (!user.enrolledCourses.includes(courseId)) {
      return res.status(403).json({ message: 'Must be enrolled to rate course' });
    }

    // Check if already rated
    const existingRatingIndex = course.ratings.findIndex(r => r.user.toString() === userId);

    if (existingRatingIndex !== -1) {
      // Update existing rating
      course.ratings[existingRatingIndex].rating = rating;
      course.ratings[existingRatingIndex].review = review;
    } else {
      // Add new rating
      course.ratings.push({
        user: userId,
        rating,
        review
      });
    }

    await course.save();

    res.status(200).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ message: 'Server error while submitting rating' });
  }
});

// AI Chatbot endpoint
app.post('/api/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message, courseId } = req.body;
    const userId = req.user.id;

    // Get course context if courseId is provided
    let courseContext = '';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) {
        courseContext = `For context, this question is about the course "${course.title}" which covers: ${course.description}. `;

        // Add module information for more context
        courseContext += "The course includes the following modules: ";
        course.modules.forEach(module => {
          courseContext += `${module.title}, `;
        });
      }
    }

    // Find or create chat history
    let chatHistory = await ChatHistory.findOne({ 
      user: userId,
      ...(courseId && { course: courseId })
    });

    if (!chatHistory) {
      chatHistory = new ChatHistory({
        user: userId,
        course: courseId,
        messages: []
      });
    }

    // Add user message to history
    chatHistory.messages.push({
      role: 'user',
      content: message
    });

    // Prepare messages for OpenAI API
    const messages = [
      { 
        role: 'system', 
        content: `You are an educational AI assistant for LearnSmart EdTech platform. ${courseContext}
        Your goal is to help students understand course material, provide explanations, and guide them through learning challenges.
        Give detailed, accurate, and helpful responses. For coding questions, provide code examples when appropriate.
        If you're unsure about specific course content, acknowledge limitations but provide general guidance.`
      }
    ];

    // Add previous messages for context (limit to last 10 for token considerations)
    const recentMessages = chatHistory.messages.slice(-10);
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500
    });

    const aiResponse = completion.choices[0].message.content;

    // Add AI response to history
    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse
    });

    // Save chat history
    await chatHistory.save();

    res.status(200).json({ 
      message: aiResponse,
      chatHistory: chatHistory.messages
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error while processing chatbot request' });
  }
});

// Get chat history
app.get('/api/chatbot/history', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    const userId = req.user.id;

    const query = { user: userId };
    if (courseId) query.course = courseId;

    const chatHistory = await ChatHistory.findOne(query);

    if (!chatHistory) {
      return res.status(200).json({ messages: [] });
    }

    res.status(200).json({ messages: chatHistory.messages });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ message: 'Server error while fetching chat history' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Additional files needed:

// .env (create this file in your project root)
/*
PORT=5000
MONGODB_URI=mongodb://localhost:27017/learnsmart
JWT_SECRET=your_secure_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
*/

// Frontend integration for the chatbot
/*
// Add this component to your frontend to implement the chatbot
// Example React component (Chatbot.js)

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = ({ courseId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Fetch chat history on component mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`/api/chatbot/history${courseId ? `?courseId=${courseId}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessages(response.data.messages);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
  }, [courseId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to use the chatbot');
        return;
      }

      const response = await axios.post('/api/chatbot', 
        { message: input, courseId }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Add AI response
      setMessages(response.data.chatHistory);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Course Assistant</h3>
        <p>Ask me anything about your course!</p>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {messages.length === 0 && (
          <div className="empty-chat">
            <p>No messages yet. Ask a question to start!</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}>
            <div className="message-content">{msg.content}</div>
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

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;

// CSS for the chatbot (Chatbot.css)
.chatbot-container {
  display: flex;
  flex-direction: column;
  height: 400px;
  width: 350px;
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chatbot-header {
  background: linear-gradient(135deg, #4a90e2, #8e44ad);
  color: white;
  padding: 15px;
  text-align: center;
}

.chatbot-header h3 {
  margin: 0;
  font-size: 18px;
}

.chatbot-header p {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #f9f9f9;
}

.empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  text-align: center;
  padding: 0 20px;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
  word-break: break-word;
}

.user-message {
  margin-left: auto;
  background-color: #4a90e2;
  color: white;
  border-radius: 18px 18px 0 18px;
}

.assistant-message {
  margin-right: auto;
  background-color: white;
  color: #333;
  border-radius: 18px 18px 18px 0;
  border: 1px solid #eee;
}

.message-content {
  padding: 10px 15px;
}

.loading-indicator {
  display: flex;
  justify-content: center;
}

.loading-indicator span {
  animation: blink 1.4s infinite both;
  font-size: 20px;
}

.loading-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0% { opacity: 0.2; }
  20% { opacity: 1; }
  100% { opacity: 0.2; }
}

.chat-input {
  display: flex;
  border-top: 1px solid #eee;
  padding: 10px;
  background-color: white;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
  outline: none;
}

.chat-input button {
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 0 15px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
}

.chat-input button:hover {
  background-color: #3a80d2;
}

.chat-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
*/