// Example usage of the natural language chat endpoint
// This demonstrates how to interact with the PostgreSQL database using natural language

const CHAT_API_URL = 'http://localhost:3000/api/chat'; // or your Vercel URL

async function chatWithDatabase(userMessage, conversationHistory = []) {
  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Handle streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';

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
            assistantMessage += data.textDelta;
            process.stdout.write(data.textDelta); // Stream output to console
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  console.log('\n'); // New line after response
  return assistantMessage;
}

// Example conversations

// Example 1: Discover database structure
async function example1() {
  console.log('🔍 Example 1: Discovering database structure\n');
  
  await chatWithDatabase(
    'What tables are in my database?'
  );
  
  console.log('\n---\n');
}

// Example 2: Learn about a specific table
async function example2() {
  console.log('📋 Example 2: Learning about a table\n');
  
  await chatWithDatabase(
    'Tell me about the structure of the users table. What columns does it have?'
  );
  
  console.log('\n---\n');
}

// Example 3: Query data with natural language
async function example3() {
  console.log('📊 Example 3: Querying data\n');
  
  await chatWithDatabase(
    'Show me the 5 most recent users who signed up, including their email and signup date'
  );
  
  console.log('\n---\n');
}

// Example 4: Aggregate queries
async function example4() {
  console.log('📈 Example 4: Aggregate analysis\n');
  
  await chatWithDatabase(
    'How many users do we have in total? Also show me how many signed up in the last 30 days'
  );
  
  console.log('\n---\n');
}

// Example 5: Complex queries with joins
async function example5() {
  console.log('🔗 Example 5: Complex query with joins\n');
  
  await chatWithDatabase(
    'Show me the top 10 users by total order amount, including their name, email, and total spent'
  );
  
  console.log('\n---\n');
}

// Example 6: Data modification
async function example6() {
  console.log('✏️ Example 6: Updating data\n');
  
  await chatWithDatabase(
    'Update the email for user with id 5 to "newemail@example.com"'
  );
  
  console.log('\n---\n');
}

// Example 7: Inserting data
async function example7() {
  console.log('➕ Example 7: Inserting data\n');
  
  await chatWithDatabase(
    'Create a new user with name "Alice Smith" and email "alice@example.com"'
  );
  
  console.log('\n---\n');
}

// Example 8: Multi-step conversation
async function example8() {
  console.log('💬 Example 8: Multi-step conversation\n');
  
  let history = [];
  
  // Step 1
  console.log('User: What tables exist?\n');
  const response1 = await chatWithDatabase('What tables exist?', history);
  history.push({ role: 'user', content: 'What tables exist?' });
  history.push({ role: 'assistant', content: response1 });
  
  console.log('\n');
  
  // Step 2 - Follow-up question
  console.log('User: Tell me more about the first table you mentioned\n');
  const response2 = await chatWithDatabase('Tell me more about the first table you mentioned', history);
  history.push({ role: 'user', content: 'Tell me more about the first table you mentioned' });
  history.push({ role: 'assistant', content: response2 });
  
  console.log('\n---\n');
}

// Example 9: Data analysis
async function example9() {
  console.log('📊 Example 9: Data analysis\n');
  
  await chatWithDatabase(
    'Analyze the orders table: show me total revenue, average order value, and number of orders per month for the last 6 months'
  );
  
  console.log('\n---\n');
}

// Example 10: Database information
async function example10() {
  console.log('ℹ️ Example 10: Database information\n');
  
  await chatWithDatabase(
    'Tell me about this database - what version of PostgreSQL is it running, how big is it, and what schemas exist?'
  );
  
  console.log('\n---\n');
}

// Run all examples
async function runAllExamples() {
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    await example5();
    // Uncomment to run data modification examples
    // await example6();
    // await example7();
    await example8();
    await example9();
    await example10();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Natural language queries you can try:
const exampleQueries = [
  // Discovery
  'What tables are in my database?',
  'Show me all the columns in the users table',
  'What are the relationships between tables?',
  'Tell me about the database structure',
  
  // Simple queries
  'Show me all users',
  'Get the first 10 orders',
  'Find users with gmail email addresses',
  'Show me active users',
  
  // Aggregations
  'How many users do we have?',
  'What is the total revenue from all orders?',
  'Show me the average order value',
  'Count orders by status',
  
  // Filtering and sorting
  'Show me users who signed up in the last week',
  'Find the most expensive orders',
  'List users sorted by signup date',
  'Show me orders over $100',
  
  // Joins and relationships
  'Show me users and their orders',
  'Which users have never placed an order?',
  'List products with their category names',
  'Show me orders with user details',
  
  // Analytics
  'Show me monthly revenue trends',
  'Who are our top 10 customers by spending?',
  'What are the most popular products?',
  'Calculate customer lifetime value',
  
  // Updates
  'Update user email where id is 5',
  'Mark order 123 as shipped',
  'Set all pending orders to processing',
  
  // Inserts
  'Add a new user named John Doe',
  'Create a new product in the electronics category',
  'Insert a new order for user 5',
  
  // Complex queries
  'Show me users who have ordered more than once',
  'Find products that have never been ordered',
  'Calculate conversion rate by month',
  'Show me revenue by product category',
];

// Export functions
export {
  chatWithDatabase,
  runAllExamples,
  exampleQueries,
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  example10
};

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

