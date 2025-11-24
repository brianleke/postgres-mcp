// Example usage of the PostgreSQL MCP Server
// This demonstrates how to interact with the MCP server

const MCP_SERVER_URL = 'http://localhost:3000/api/mcp'; // or your Vercel URL

// Example 1: Get database information
async function getDatabaseInfo() {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'get_database_info',
      parameters: {}
    })
  });
  
  const result = await response.json();
  console.log('Database Info:', result);
}

// Example 2: List all tables
async function listTables() {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'list_tables',
      parameters: {
        schema: 'public'
      }
    })
  });
  
  const result = await response.json();
  console.log('Tables:', result);
}

// Example 3: Describe a table
async function describeTable(tableName) {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'describe_table',
      parameters: {
        tableName: tableName,
        schema: 'public'
      }
    })
  });
  
  const result = await response.json();
  console.log('Table Structure:', result);
}

// Example 4: Execute a SELECT query
async function queryUsers() {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'execute_query',
      parameters: {
        query: 'SELECT * FROM users WHERE age > $1 LIMIT $2',
        params: [18, 10]
      }
    })
  });
  
  const result = await response.json();
  console.log('Query Results:', result);
}

// Example 5: Insert data
async function insertUser(name, email) {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'execute_mutation',
      parameters: {
        query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        params: [name, email]
      }
    })
  });
  
  const result = await response.json();
  console.log('Insert Result:', result);
}

// Example 6: Update data
async function updateUser(userId, newEmail) {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'execute_mutation',
      parameters: {
        query: 'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
        params: [newEmail, userId]
      }
    })
  });
  
  const result = await response.json();
  console.log('Update Result:', result);
}

// Example 7: Execute transaction
async function transferBalance(fromUserId, toUserId, amount) {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'execute_transaction',
      parameters: {
        queries: [
          {
            query: 'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
            params: [amount, fromUserId]
          },
          {
            query: 'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2',
            params: [amount, toUserId]
          },
          {
            query: 'INSERT INTO transactions (from_user_id, to_user_id, amount) VALUES ($1, $2, $3)',
            params: [fromUserId, toUserId, amount]
          }
        ]
      }
    })
  });
  
  const result = await response.json();
  console.log('Transaction Result:', result);
}

// Example 8: Complex query with JOIN
async function getUsersWithOrders() {
  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tool: 'execute_query',
      parameters: {
        query: `
          SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(o.id) as order_count,
            SUM(o.total) as total_spent
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          GROUP BY u.id, u.name, u.email
          ORDER BY total_spent DESC
          LIMIT $1
        `,
        params: [10]
      }
    })
  });
  
  const result = await response.json();
  console.log('Users with Orders:', result);
}

// Run examples (uncomment to test)
// getDatabaseInfo();
// listTables();
// describeTable('users');
// queryUsers();
// insertUser('John Doe', 'john@example.com');
// updateUser(1, 'newemail@example.com');
// transferBalance(1, 2, 100.00);
// getUsersWithOrders();

export {
  getDatabaseInfo,
  listTables,
  describeTable,
  queryUsers,
  insertUser,
  updateUser,
  transferBalance,
  getUsersWithOrders
};

