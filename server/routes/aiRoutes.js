import express from 'express';
import { authMiddleware } from '../auth.js';
import { callProvider } from '../services/ai.js';
import { getPlatformSetting } from '../services/settings.js';

const router = express.Router();

// AI Assistant Chat Endpoint
router.post('/assistant', authMiddleware, async (req, res) => {
  try {
    const { messages, mode = 'chat', provider = 'gemini', model, politician_id } = req.body;

    // Get API key for the provider
    let apiKey;
    switch(provider) {
      case 'mistral':
        apiKey = await getPlatformSetting('MISTRAL_API_KEY');
        break;
      case 'nvidia':
        apiKey = await getPlatformSetting('NVIDIA_API_KEY');
        break;
      case 'groq':
        apiKey = await getPlatformSetting('GROQ_API_KEY');
        break;
      case 'gemini':
        apiKey = await getPlatformSetting('GOOGLE_GEMINI_API_KEY') || process.env.GOOGLE_GEMINI_API_KEY;
        break;
      default:
        apiKey = await getPlatformSetting('GOOGLE_GEMINI_API_KEY') || process.env.GOOGLE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      return res.status(400).json({ error: `${provider} API key not configured` });
    }

    // System prompt based on mode
    const systemPrompts = {
      chat: "You are a helpful political assistant providing concise, factual responses.",
      analysis: "Analyze the following political data and provide strategic insights.",
      content: "Generate engaging political content suitable for social media distribution.",
      research: "Conduct thorough research on the topic and provide comprehensive answers."
    };

    const system = systemPrompts[mode] || systemPrompts.chat;

    // Call the AI provider
    const response = await callProvider(
      provider, 
      apiKey, 
      system, 
      messages, 
      2048, // maxTokens
      0.7   // temperature
    );

    res.json({ 
      response: response,
      provider: provider,
      mode: mode
    });

  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ 
      error: 'AI service error', 
      message: error.message 
    });
  }
});

// AI Content Generation Endpoint
router.post('/generate-content', authMiddleware, async (req, res) => {
  try {
    const { topic, type, tone, length, politician_id } = req.body;
    
    const prompts = {
      speech: `Write a ${tone} speech about "${topic}" for a political audience. Length: ${length} words.`,
      press: `Draft a ${tone} press release about "${topic}". Length: ${length} words.`,
      social: `Create a ${tone} social media post about "${topic}". Length: ${length} words.`,
      policy: `Outline ${tone} policy positions on "${topic}". Length: ${length} words.`
    };

    const messages = [{
      role: 'user',
      content: prompts[type] || prompts.speech
    }];

    const apiKey = await getPlatformSetting('GOOGLE_GEMINI_API_KEY') || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Google Gemini API key not configured' });
    }

    const response = await callProvider(
      'gemini',
      apiKey,
      'You are a professional political content writer.',
      messages,
      2048,
      0.7
    );

    res.json({ content: response });

  } catch (error) {
    console.error('Content Generation Error:', error);
    res.status(500).json({ 
      error: 'Content generation failed',
      message: error.message 
    });
  }
});

// AI Analysis Endpoint
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { data, analysisType, politician_id } = req.body;
    
    const analysisPrompts = {
      sentiment: 'Analyze the sentiment of the following political data and provide a score from -1 to 1:',
      trends: 'Identify key trends and patterns in this political data:',
      opposition: 'Analyze opposition strategies and weaknesses in this data:',
      opportunities: 'Identify political opportunities and actionable insights:'
    };

    const messages = [{
      role: 'user',
      content: `${analysisPrompts[analysisType]}\n\n${JSON.stringify(data)}`
    }];

    const apiKey = await getPlatformSetting('GOOGLE_GEMINI_API_KEY') || process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'Google Gemini API key not configured' });
    }

    const response = await callProvider(
      'gemini',
      apiKey,
      'You are a political data analyst providing strategic insights.',
      messages,
      2048,
      0.5
    );

    res.json({ analysis: response });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

export default router;
