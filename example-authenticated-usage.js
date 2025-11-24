// Example usage of the authenticated MCP endpoint
// This demonstrates how to make authenticated requests to the PostgreSQL MCP Server

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000/api/mcp';
const MCP_API_KEY = process.env.MCP_API_KEY; // Your API key

// Helper function to make authenticated MCP requests
async function callMcpTool(tool, parameters) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add authentication if API key is provided
  if (MCP_API_KEY) {
    headers['Authorization'] = `Bearer ${MCP_API_KEY}`;
    // Alternative: headers['x-api-key'] = MCP_API_KEY;
  }

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tool,
      parameters
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`MCP Error: ${error.error || response.statusText}`);
  }

  return await response.json();
}

// Example 1: List tables with authentication
async function listTablesAuthenticated() {
  try {
    console.log('🔐 Calling authenticated MCP endpoint...\n');
    
    const result = await callMcpTool('list_tables', {
      schema: 'public'
    });
    
    console.log('✅ Success! Tables:', result);
    return result;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Invalid or missing API key')) {
      console.log('\n💡 Tip: Set MCP_API_KEY environment variable');
      console.log('   export MCP_API_KEY=your-secret-key');
    }
  }
}

// Example 2: Execute query with authentication
async function executeQueryAuthenticated() {
  try {
    const result = await callMcpTool('execute_query', {
      query: 'SELECT * FROM users WHERE id = $1',
      params: [1]
    });
    
    console.log('Query Results:', result);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 3: Get database info with authentication
async function getDatabaseInfoAuthenticated() {
  try {
    const result = await callMcpTool('get_database_info', {});
    
    console.log('Database Info:', result);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 4: Describe table with authentication
async function describeTableAuthenticated(tableName) {
  try {
    const result = await callMcpTool('describe_table', {
      tableName: tableName,
      schema: 'public'
    });
    
    console.log(`Table "${tableName}" structure:`, result);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 5: Execute mutation with authentication
async function executeMutationAuthenticated() {
  try {
    const result = await callMcpTool('execute_mutation', {
      query: 'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      params: ['John Doe', 'john@example.com']
    });
    
    console.log('Mutation Result:', result);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 6: Execute transaction with authentication
async function executeTransactionAuthenticated() {
  try {
    const result = await callMcpTool('execute_transaction', {
      queries: [
        {
          query: 'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
          params: [100, 1]
        },
        {
          query: 'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2',
          params: [100, 2]
        },
        {
          query: 'INSERT INTO transactions (from_user_id, to_user_id, amount) VALUES ($1, $2, $3)',
          params: [1, 2, 100]
        }
      ]
    });
    
    console.log('Transaction Result:', result);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example 7: Multiple authenticated requests
async function runMultipleRequests() {
  console.log('🔄 Running multiple authenticated requests...\n');
  
  try {
    // Get database info
    console.log('1️⃣ Getting database info...');
    const dbInfo = await callMcpTool('get_database_info', {});
    console.log('   Database:', dbInfo.currentDatabase);
    console.log('   Version:', dbInfo.version.split('\n')[0]);
    console.log('   Size:', dbInfo.databaseSize);
    
    // List tables
    console.log('\n2️⃣ Listing tables...');
    const tables = await callMcpTool('list_tables', { schema: 'public' });
    console.log('   Found', tables.tables.length, 'tables');
    
    // Describe first table (if exists)
    if (tables.tables.length > 0) {
      const firstTable = tables.tables[0].table_name;
      console.log(`\n3️⃣ Describing table "${firstTable}"...`);
      const structure = await callMcpTool('describe_table', { 
        tableName: firstTable,
        schema: 'public'
      });
      console.log('   Columns:', structure.columns.length);
      console.log('   Primary Keys:', structure.primaryKeys);
    }
    
    console.log('\n✅ All requests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 8: Test authentication
async function testAuthentication() {
  console.log('🔐 Testing MCP Authentication\n');
  console.log('Server URL:', MCP_SERVER_URL);
  console.log('API Key:', MCP_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('');
  
  if (!MCP_API_KEY) {
    console.log('⚠️  Warning: MCP_API_KEY is not set.');
    console.log('   If the server requires authentication, requests will fail.');
    console.log('   Set it with: export MCP_API_KEY=your-secret-key\n');
  }
  
  try {
    const result = await callMcpTool('get_database_info', {});
    console.log('✅ Authentication successful!');
    console.log('   Connected to:', result.currentDatabase);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    if (error.message.includes('Invalid or missing API key')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Check that MCP_API_KEY is set correctly');
      console.log('   2. Verify the API key matches the server configuration');
      console.log('   3. Make sure the server has MCP_API_KEY environment variable set');
    }
    return false;
  }
}

// Command-line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (!command) {
    console.log('📖 Authenticated MCP Usage Examples\n');
    console.log('Usage: node example-authenticated-usage.js <command>\n');
    console.log('Commands:');
    console.log('  test              - Test authentication');
    console.log('  list              - List all tables');
    console.log('  info              - Get database info');
    console.log('  describe <table>  - Describe a table');
    console.log('  multi             - Run multiple requests');
    console.log('');
    console.log('Environment Variables:');
    console.log('  MCP_SERVER_URL    - Server URL (default: http://localhost:3000/api/mcp)');
    console.log('  MCP_API_KEY       - API key for authentication');
    console.log('');
    console.log('Examples:');
    console.log('  MCP_API_KEY=secret123 node example-authenticated-usage.js test');
    console.log('  MCP_API_KEY=secret123 node example-authenticated-usage.js list');
    console.log('  MCP_API_KEY=secret123 node example-authenticated-usage.js describe users');
    process.exit(0);
  }
  
  switch (command) {
    case 'test':
      testAuthentication();
      break;
    case 'list':
      listTablesAuthenticated();
      break;
    case 'info':
      getDatabaseInfoAuthenticated();
      break;
    case 'describe':
      const tableName = process.argv[3];
      if (!tableName) {
        console.error('Error: Please provide a table name');
        console.log('Usage: node example-authenticated-usage.js describe <table>');
        process.exit(1);
      }
      describeTableAuthenticated(tableName);
      break;
    case 'multi':
      runMultipleRequests();
      break;
    default:
      console.error('Unknown command:', command);
      console.log('Run without arguments to see available commands');
      process.exit(1);
  }
}

// Export functions for use in other modules
export {
  callMcpTool,
  listTablesAuthenticated,
  executeQueryAuthenticated,
  getDatabaseInfoAuthenticated,
  describeTableAuthenticated,
  executeMutationAuthenticated,
  executeTransactionAuthenticated,
  runMultipleRequests,
  testAuthentication
};

