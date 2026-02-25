const Groq = require('groq-sdk');

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

// Fallback word filter for when Groq is not available
const profanityList = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'bastard', 'dick',
  'pussy', 'cock', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot',
  'retard', 'idiot', 'stupid', 'moron', 'dumb', 'kill yourself', 'kys',
  'die', 'rape', 'stfu', 'wtf', 'lmfao', 'bullshit', 'asshole',
  'motherfucker', 'fucker', 'dumbass', 'jackass', 'piss', 'crap',
  'douche', 'wanker', 'twat', 'prick', 'screw you', 'go to hell',
  'suck my', 'blow me', 'eat shit', 'piece of shit'
];

// Check with fallback word filter
const fallbackFilter = (message) => {
  const lowerMsg = message.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
  
  for (const word of profanityList) {
    if (lowerMsg.includes(word.toLowerCase())) {
      return {
        isInappropriate: true,
        reason: `Message contains inappropriate language`
      };
    }
  }
  
  return { isInappropriate: false, reason: null };
};

// Check message with Groq AI
const moderateMessage = async (message) => {
  const client = getGroqClient();
  
  // If Groq is not configured, use fallback
  if (!client) {
    return fallbackFilter(message);
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a chat content moderator. Analyze the following message and determine if it contains:
- Profanity, slang, or abusive language
- Hate speech or discrimination
- Threats or harassment
- Sexually explicit content
- Spam or gibberish meant to bypass filters

Respond with ONLY a JSON object in this exact format:
{"isInappropriate": true/false, "reason": "brief reason or null"}

Be strict but fair. Normal conversations, friendly banter, and mild expressions are OK. Only flag genuinely harmful or abusive content.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.1,
      max_tokens: 100
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    try {
      // Try to parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If parsing fails, check if response indicates inappropriate
      if (response.toLowerCase().includes('"isinappropriate": true') || 
          response.toLowerCase().includes('"isinappropriate":true')) {
        return { isInappropriate: true, reason: 'Content flagged by AI moderator' };
      }
    }

    // If Groq response is unclear, use fallback as secondary check
    return fallbackFilter(message);
  } catch (error) {
    console.error('Groq moderation error:', error.message);
    // Fallback to word filter if Groq fails
    return fallbackFilter(message);
  }
};

module.exports = { moderateMessage };
