# 🚀 Quick Start Guide

Get up and running with your PostgreSQL MCP Server in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A PostgreSQL database
- OpenAI API key (for natural language interface)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example
cp .env.local.example .env
```

Edit `.env` and add your credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_SSL=false
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Getting Your Keys

**PostgreSQL Database:**
- Local: `postgresql://postgres:password@localhost:5432/mydb`
- [Neon](https://neon.tech): Free PostgreSQL database
- [Supabase](https://supabase.com): Free tier available
- [Railway](https://railway.app): Easy deployment

**OpenAI API Key:**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy and paste into `.env`

## Step 3: Run the Server

```bash
npm run dev
```

You should see:
```
✔ Ready on http://localhost:3000
```

## Step 4: Try It Out!

### Option A: Web Interface (Easiest)

1. Open `example-chat.html` in your browser
2. Type a question: "What tables are in my database?"
3. Hit Enter and watch the magic! ✨

### Option B: Command Line

```bash
# Health check
curl http://localhost:3000/api/chat

# Send a query
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Show me all tables in the database"
      }
    ]
  }'
```

### Option C: Node.js

```javascript
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'How many users do we have?' }
    ]
  })
});
```

## Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variables
vercel env add DATABASE_URL
vercel env add DATABASE_SSL
vercel env add OPENAI_API_KEY

# Deploy!
vercel
```

Your server is now live! 🎉

## Example Queries to Try

### Discovery
```
"What tables are in my database?"
"Show me the structure of the users table"
"What columns does the orders table have?"
```

### Simple Queries
```
"Show me all users"
"Get the 10 most recent orders"
"Find users with gmail addresses"
```

### Analytics
```
"How many users signed up last month?"
"What is the total revenue from all orders?"
"Show me the top 10 customers by spending"
```

### Data Operations
```
"Create a new user named John Doe with email john@example.com"
"Update the email for user id 5 to newemail@example.com"
"Delete all orders older than 2 years"
```

## Troubleshooting

### "Connection refused"
- Make sure your database is running
- Check DATABASE_URL is correct
- Verify network access

### "OPENAI_API_KEY is not configured"
- Add your OpenAI API key to `.env`
- Restart the server

### "Permission denied"
- Check database user has necessary permissions
- Try connecting with a superuser first

### Slow Responses
- First query may be slower (schema discovery)
- Subsequent queries are faster
- Consider using GPT-3.5-turbo for speed

## Next Steps

✅ **Read the full documentation:**
- [NATURAL-LANGUAGE.md](NATURAL-LANGUAGE.md) - Complete guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment

✅ **Explore examples:**
- Open `example-chat.html` - Beautiful web UI
- Run `example-chat-usage.js` - Node.js examples

✅ **Customize:**
- Change AI model in `api/chat.js`
- Add authentication
- Implement rate limiting

## Support

Having issues? Check:
- [README.md](README.md) - Full documentation
- [NATURAL-LANGUAGE.md](NATURAL-LANGUAGE.md) - Detailed guide
- Database connection string format
- OpenAI API key validity

## What's Next?

🎨 **Customize the UI**: Edit `example-chat.html` to match your brand

🔐 **Add Security**: Implement authentication and rate limiting

📊 **Build Dashboards**: Create custom analytics dashboards

🤖 **Extend Functionality**: Add custom tools and integrations

Happy querying! 🚀

