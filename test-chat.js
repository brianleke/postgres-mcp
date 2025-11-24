#!/usr/bin/env node

/**
 * Simple test script for the natural language chat interface
 * Usage: node test-chat.js "Your question here"
 */

const API_URL = process.env.CHAT_API_URL || 'http://localhost:3000/api/chat';

async function chat(message) {
  console.log('\n🤔 Question:', message);
  console.log('\n💭 Thinking...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('🤖 Answer:\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('0:')) {
          try {
            const data = JSON.parse(line.slice(2));
            if (data.type === 'text-delta' && data.textDelta) {
              process.stdout.write(data.textDelta);
              fullResponse += data.textDelta;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    console.log('\n\n✅ Done!\n');
    return fullResponse;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Is the server running? (npm run dev)');
    console.error('  2. Is DATABASE_URL configured?');
    console.error('  3. Is OPENAI_API_KEY configured?');
    console.error('  4. Can you access:', API_URL);
    process.exit(1);
  }
}

// Get question from command line arguments
const question = process.argv.slice(2).join(' ');

if (!question) {
  console.log('📖 PostgreSQL Natural Language Chat - Test Script\n');
  console.log('Usage:');
  console.log('  node test-chat.js "Your question here"\n');
  console.log('Examples:');
  console.log('  node test-chat.js "What tables are in my database?"');
  console.log('  node test-chat.js "Show me all users"');
  console.log('  node test-chat.js "How many orders were placed last month?"');
  console.log('  node test-chat.js "Describe the users table"\n');
  console.log('Environment:');
  console.log(`  CHAT_API_URL: ${API_URL}`);
  console.log('\nMake sure the server is running: npm run dev\n');
  process.exit(0);
}

// Run the chat
chat(question);

