# 🐘 PostgreSQL MCP Server with Natural Language Interface

A Model Context Protocol (MCP) server that exposes PostgreSQL database operations as tools, deployable on Vercel. Now with **Natural Language Interface** powered by AI!

```
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL MCP Server                      │
│                                                             │
│  ┌──────────────┐         ┌─────────────────┐             │
│  │   Web Chat   │────────▶│  /api/chat      │             │
│  │     UI       │         │  (Natural Lang) │             │
│  └──────────────┘         └────────┬────────┘             │
│                                    │                       │
│  ┌──────────────┐                  ▼                       │
│  │   Your App   │         ┌─────────────────┐             │
│  │  (MCP Client)│────────▶│   GPT-4 AI      │             │
│  └──────────────┘         └────────┬────────┘             │
│                                    │                       │
│  ┌──────────────┐                  ▼                       │
│  │   CLI Tool   │         ┌─────────────────┐             │
│  │              │────────▶│   /api/mcp      │             │
│  └──────────────┘         │  (MCP Tools)    │             │
│                           └────────┬────────┘             │
│                                    │                       │
│                                    ▼                       │
│                           ┌─────────────────┐             │
│                           │   PostgreSQL    │             │
│                           │    Database     │             │
│                           └─────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 🌟 Features

### MCP Tools (Standard Interface)

This MCP server provides the following PostgreSQL operations as tools:

- **execute_query**: Execute SELECT queries and return results
- **execute_mutation**: Execute INSERT, UPDATE, DELETE queries
- **list_tables**: List all tables in a schema
- **describe_table**: Get detailed table structure information
- **execute_transaction**: Execute multiple queries in a transaction
- **get_database_info**: Get database metadata and information

### 🤖 Natural Language Interface (NEW!)

Interact with your PostgreSQL database using plain English:

- **"Show me all users who signed up last week"** 
- **"What is the total revenue from orders?"**
- **"Create a new user named John Doe"**
- **"Which tables exist in my database?"**

No SQL knowledge required! The AI automatically:
- Discovers your database schema
- Generates optimized SQL queries
- Executes them safely
- Returns results in natural language

👉 **See [NATURAL-LANGUAGE.md](NATURAL-LANGUAGE.md) for full documentation**

## Prerequisites

- Node.js 18 or higher
- A PostgreSQL database
- A Vercel account (for deployment)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Update the `.env` file with your credentials:**
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   DATABASE_SSL=false
   OPENAI_API_KEY=sk-your-openai-api-key  # Required for natural language interface
   ```

4. **Run locally with Vercel CLI:**
   ```bash
   npm run dev
   ```

5. **Test the endpoints:**
   ```bash
   # MCP endpoint
   curl http://localhost:3000/api/mcp
   
   # Natural language endpoint
   curl http://localhost:3000/api/chat
   ```

6. **Try the chat interface:**
   Open `example-chat.html` in your browser

## Deployment to Vercel

1. **Install Vercel CLI (if not already installed):**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Set environment variables:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add DATABASE_SSL
   ```
   
   Enter your database connection string when prompted.

4. **Deploy:**
   ```bash
   npm run deploy
   ```

   Or simply:
   ```bash
   vercel
   ```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `DATABASE_SSL`: Set to `true` if your database requires SSL (common for cloud providers)
- `OPENAI_API_KEY`: Your OpenAI API key (required for natural language interface)

## API Endpoints

### POST /api/mcp
Main MCP handler endpoint for tool execution.

### GET /api/mcp
Health check endpoint that returns server information and available tools.

### POST /api/chat
Natural language interface for database interactions. Send queries in plain English!

### GET /api/chat
Health check for the chat endpoint.

## 🎯 Quick Start Guide

### Option 1: Natural Language Interface (Easiest!)

Perfect for anyone - no SQL knowledge required!

```bash
# 1. Set up environment variables (including OPENAI_API_KEY)
# 2. Start the server
npm run dev

# 3. Open example-chat.html in your browser
# 4. Start chatting with your database!
```

**Example queries:**
- "Show me all tables"
- "How many users signed up last week?"
- "Create a new user named Alice"

### Option 2: Direct MCP Tools (For Developers)

Use the MCP protocol directly for programmatic access.

```javascript
// Call tools directly via the MCP endpoint
fetch('http://localhost:3000/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'execute_query',
    parameters: { query: 'SELECT * FROM users LIMIT 10' }
  })
});
```

## Tool Usage Examples

### execute_query
```json
{
  "tool": "execute_query",
  "parameters": {
    "query": "SELECT * FROM users WHERE id = $1",
    "params": [1]
  }
}
```

### execute_mutation
```json
{
  "tool": "execute_mutation",
  "parameters": {
    "query": "INSERT INTO users (name, email) VALUES ($1, $2)",
    "params": ["John Doe", "john@example.com"]
  }
}
```

### list_tables
```json
{
  "tool": "list_tables",
  "parameters": {
    "schema": "public"
  }
}
```

### describe_table
```json
{
  "tool": "describe_table",
  "parameters": {
    "tableName": "users",
    "schema": "public"
  }
}
```

### execute_transaction
```json
{
  "tool": "execute_transaction",
  "parameters": {
    "queries": [
      {
        "query": "INSERT INTO users (name) VALUES ($1)",
        "params": ["Alice"]
      },
      {
        "query": "UPDATE accounts SET balance = balance - 100 WHERE user_id = $1",
        "params": [1]
      }
    ]
  }
}
```

### get_database_info
```json
{
  "tool": "get_database_info",
  "parameters": {}
}
```

## Security Considerations

- The `execute_query` tool only allows SELECT and WITH queries for safety
- Use parameterized queries to prevent SQL injection
- Store database credentials securely using Vercel environment variables
- Consider implementing authentication for production use
- Enable SSL for database connections when using cloud providers

## Database Providers

This MCP server works with any PostgreSQL-compatible database, including:

- PostgreSQL (self-hosted)
- Amazon RDS for PostgreSQL
- Google Cloud SQL for PostgreSQL
- Azure Database for PostgreSQL
- Neon
- Supabase
- Railway
- Render

## Troubleshooting

### Connection Issues
- Ensure your database allows connections from Vercel's IP ranges
- Check that SSL settings match your database requirements
- Verify the DATABASE_URL format is correct

### Query Timeouts
- Adjust the `connectionTimeoutMillis` in the connection pool configuration
- Optimize slow queries
- Check database performance

## 📖 Documentation

- **[NATURAL-LANGUAGE.md](NATURAL-LANGUAGE.md)** - Complete guide to the natural language interface
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment instructions
- **[example-chat.html](example-chat.html)** - Beautiful web interface for chatting with your database
- **[example-chat-usage.js](example-chat-usage.js)** - Node.js examples for programmatic usage
- **[example-usage.js](example-usage.js)** - Direct MCP tool usage examples

## 🎬 Example Use Cases

### Business Analytics
```
"Show me monthly revenue trends for the last year"
"Who are my top 10 customers?"
"What's the average order value by product category?"
```

### Data Exploration
```
"What tables exist in my database?"
"Show me the structure of the users table"
"Find all users who haven't logged in for 30 days"
```

### Data Management
```
"Update the email for user id 123"
"Delete all orders older than 2 years"
"Create a new product in the electronics category"
```

### Complex Operations
```
"Transfer $100 from account A to account B"
"Calculate customer lifetime value for all users"
"Generate a sales report for Q4 2024"
```

## 🔄 How It Works

### MCP Endpoint (`/api/mcp`)
```
Client → MCP Request → Tool Execution → Database → Response
```

### Natural Language Endpoint (`/api/chat`)
```
User Query → AI (GPT-4) → Tool Selection → MCP Tools → Database → Natural Language Response
```

The AI automatically:
1. Understands your intent
2. Discovers database schema if needed
3. Generates appropriate SQL
4. Executes via MCP tools
5. Formats results naturally

## 🛡️ Security Features

- ✅ Parameterized queries (SQL injection protection)
- ✅ Read/write operation separation
- ✅ Connection pooling
- ✅ SSL/TLS support
- ✅ Transaction support with rollback
- ✅ Environment variable protection

**Recommended for Production:**
- Add API key authentication
- Implement rate limiting
- Set up monitoring and alerts
- Use database user with minimal permissions
- Enable audit logging

## 🚀 Performance

- Connection pooling for optimal performance
- Streaming responses for real-time feedback
- Efficient SQL query generation by AI
- Support for complex queries and joins

## 💡 Tips

1. **Start with Discovery**: Ask "What tables exist?" to understand your database
2. **Be Specific**: More context = better results
3. **Use Follow-ups**: Build on previous queries in a conversation
4. **Check Results**: Always verify important operations
5. **Leverage Transactions**: Use transactions for multi-step operations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Areas for improvement:
- Additional AI providers (Anthropic, Google, etc.)
- Query result caching
- User authentication
- Rate limiting
- Query history and favorites

## 📄 License

MIT License

