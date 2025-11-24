# Natural Language Interface

This PostgreSQL MCP Server includes a powerful natural language interface that allows you to interact with your database using plain English (or any language supported by the AI model).

## 🌟 Features

- **Natural Language Queries**: Ask questions in plain English instead of writing SQL
- **Automatic Schema Discovery**: The AI learns your database structure automatically
- **Smart SQL Generation**: Converts your questions into optimized SQL queries
- **Streaming Responses**: Real-time response streaming for immediate feedback
- **Multi-step Conversations**: Context-aware conversations for complex tasks
- **Safe Operations**: Built-in safeguards and parameterized queries

## 🚀 Quick Start

### 1. Set Up Environment Variables

Add your OpenAI API key to your environment:

```bash
# Local development (.env file)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Vercel deployment
vercel env add OPENAI_API_KEY
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm run dev
```

### 4. Try the Chat Interface

Open `example-chat.html` in your browser or use the API directly.

## 📡 API Endpoint

### POST /api/chat

Send natural language queries to your database.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Show me all users who signed up in the last 7 days"
    }
  ]
}
```

**Response:**
Streams back the AI's response with SQL queries and results.

## 💬 Example Queries

### Database Discovery

```
"What tables are in my database?"
"Show me the structure of the users table"
"What are all the columns in the orders table?"
"Tell me about the relationships between tables"
```

### Simple Queries

```
"Show me all users"
"Get the first 10 orders"
"Find users with @gmail.com email addresses"
"List all active subscriptions"
```

### Filtering and Sorting

```
"Show me users who signed up in the last month"
"Find orders over $100"
"List products sorted by price"
"Get the 5 most recent transactions"
```

### Aggregations

```
"How many users do we have?"
"What is the total revenue from all orders?"
"Show me the average order value"
"Count orders by status"
```

### Complex Analytics

```
"Show me monthly revenue for the last 6 months"
"Who are the top 10 customers by total spending?"
"Calculate the conversion rate by month"
"Show me products that have never been ordered"
```

### Joins and Relationships

```
"Show me users and their orders"
"Which users have never placed an order?"
"List products with their category names"
"Find all orders with customer details"
```

### Data Modifications

```
"Update the email for user id 5 to 'new@email.com'"
"Create a new user named John Doe with email john@example.com"
"Mark order 123 as shipped"
"Delete all orders older than 2 years"
```

## 🎨 Using the Web Interface

The included `example-chat.html` provides a beautiful, modern chat interface:

1. **Open the file** in your browser
2. **Update the API_URL** to point to your server (localhost or Vercel URL)
3. **Start chatting** with your database!

Features:
- 💬 Real-time streaming responses
- 🎯 Click example queries to get started
- 💅 Beautiful gradient UI
- 📱 Responsive design
- 🔄 Maintains conversation context

## 🔧 Programmatic Usage

### Node.js

```javascript
import { chatWithDatabase } from './example-chat-usage.js';

const response = await chatWithDatabase(
  'Show me the top 5 users by order count'
);

console.log(response);
```

### Multi-step Conversation

```javascript
let history = [];

// First query
const response1 = await chatWithDatabase(
  'What tables exist?',
  history
);
history.push({ role: 'user', content: 'What tables exist?' });
history.push({ role: 'assistant', content: response1 });

// Follow-up query (with context)
const response2 = await chatWithDatabase(
  'Tell me more about the users table',
  history
);
```

### With Fetch API

```javascript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Show me all users' }
    ]
  })
});

// Handle streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process chunk...
}
```

## 🤖 How It Works

1. **User Input**: You ask a question in natural language
2. **AI Processing**: GPT-4 analyzes your question and available tools
3. **Schema Discovery**: If needed, the AI queries your database schema
4. **SQL Generation**: The AI generates appropriate SQL queries
5. **Execution**: Queries are executed using the PostgreSQL tools
6. **Response**: Results are formatted and returned in natural language

### Tool Chain Example

For the query "Show me the top 5 users by order count":

1. **list_tables** - Discovers available tables
2. **describe_table** - Gets structure of users and orders tables
3. **execute_query** - Runs the SQL query:
   ```sql
   SELECT u.id, u.name, COUNT(o.id) as order_count
   FROM users u
   LEFT JOIN orders o ON u.id = o.user_id
   GROUP BY u.id, u.name
   ORDER BY order_count DESC
   LIMIT 5
   ```
4. **Format** - Returns results in readable format

## ⚙️ Configuration

### Changing the AI Model

Edit `api/chat.js`:

```javascript
const result = streamText({
  model: openai('gpt-4-turbo-preview'), // Change this
  // Other options:
  // openai('gpt-4')
  // openai('gpt-3.5-turbo')
  // anthropic('claude-3-opus-20240229')
  // ...
});
```

### Adjusting Max Steps

Control how many tool calls the AI can make:

```javascript
const result = streamText({
  model: openai('gpt-4-turbo-preview'),
  maxSteps: 10, // Increase for more complex operations
  // ...
});
```

### Custom System Prompt

Modify the `systemPrompt` in `api/chat.js` to change the AI's behavior:

```javascript
const systemPrompt = `You are a helpful PostgreSQL database assistant...`;
```

## 🔒 Security Considerations

### 1. Authentication
Add authentication to the chat endpoint:

```javascript
export const POST = async (req) => {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... rest of handler
};
```

### 2. Rate Limiting
Implement rate limiting to prevent abuse:

```javascript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

### 3. Query Restrictions
The system already uses parameterized queries and separates read/write operations.

### 4. Cost Control
Monitor OpenAI API usage and set limits in your OpenAI dashboard.

## 💰 Cost Estimation

### OpenAI API Costs (GPT-4 Turbo)
- Input: ~$10 per 1M tokens
- Output: ~$30 per 1M tokens

### Typical Query Costs
- Simple query: $0.01 - $0.02
- Complex analysis: $0.05 - $0.10
- Multi-step conversation: $0.10 - $0.30

### Cost Optimization Tips
1. Use GPT-3.5-turbo for simpler queries ($0.0005 per 1k tokens)
2. Implement caching for common queries
3. Set reasonable maxSteps limits
4. Use shorter system prompts

## 🐛 Troubleshooting

### "OPENAI_API_KEY is not configured"
Set your OpenAI API key in environment variables.

### Slow Responses
- Try using a faster model (gpt-3.5-turbo)
- Reduce maxSteps
- Optimize your database indexes

### Incorrect SQL Generation
- The AI learns from your schema automatically
- Provide more context in your query
- Use follow-up questions to refine

### Connection Errors
- Ensure DATABASE_URL is correct
- Check database is accessible from Vercel
- Verify SSL settings

## 🎯 Best Practices

1. **Be Specific**: "Show me users who signed up today" is better than "show users"
2. **Provide Context**: "Update the email for user id 5" is better than "update email"
3. **Use Follow-ups**: Ask follow-up questions to refine results
4. **Check Results**: Always verify important operations
5. **Start Simple**: Begin with discovery queries before complex operations

## 🚀 Advanced Usage

### Custom Tool Integration

Add your own tools to extend functionality:

```javascript
const customTool = tool({
  description: 'Send email to users',
  parameters: z.object({
    userIds: z.array(z.number()),
    message: z.string()
  }),
  execute: async ({ userIds, message }) => {
    // Your custom logic
  }
});
```

### Streaming Progress Updates

Handle tool execution progress:

```javascript
const result = streamText({
  model: openai('gpt-4-turbo-preview'),
  onStepFinish: (step) => {
    console.log('Tool executed:', step.toolName);
  }
});
```

### Error Handling

Implement custom error handling:

```javascript
try {
  const result = await chatWithDatabase(query);
} catch (error) {
  if (error.message.includes('SQL')) {
    // Handle SQL errors
  } else if (error.message.includes('API')) {
    // Handle API errors
  }
}
```

## 📚 Additional Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add support for other AI providers (Anthropic, Google, etc.)
- [ ] Implement query result caching
- [ ] Add voice input support
- [ ] Create a React/Next.js component library
- [ ] Add query history and favorites
- [ ] Implement user authentication
- [ ] Add support for database migrations
- [ ] Create a Chrome extension

## 📄 License

MIT License - feel free to use this in your projects!

