#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

async function setupDatabase() {
  console.log('🚀 Setting up TrendFeed database...');
  
  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('already exists')) {
            console.error('❌ SQL Error:', error.message);
          }
        } catch (err) {
          // Some statements might fail if tables already exist, that's okay
          if (!err.message.includes('already exists')) {
            console.error('❌ SQL Error:', err.message);
          }
        }
      }
    }
    
    console.log('✅ Database setup completed!');
    
    // Test the setup
    await testDatabase();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

async function testDatabase() {
  console.log('🧪 Testing database setup...');
  
  try {
    // Test sources table
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .limit(1);
    
    if (sourcesError) {
      console.error('❌ Sources table test failed:', sourcesError.message);
      return;
    }
    
    console.log(`✅ Sources table: ${sources.length} records found`);
    
    // Test daily_trends view
    const { data: trends, error: trendsError } = await supabase
      .from('daily_trends')
      .select('*')
      .limit(1);
    
    if (trendsError) {
      console.error('❌ Daily trends view test failed:', trendsError.message);
      return;
    }
    
    console.log(`✅ Daily trends view: ${trends.length} records found`);
    
    // Test get_top_trends function
    const { data: topTrends, error: topTrendsError } = await supabase
      .rpc('get_top_trends', { target_date: new Date().toISOString().split('T')[0], limit_count: 5 });
    
    if (topTrendsError) {
      console.error('❌ Get top trends function test failed:', topTrendsError.message);
      return;
    }
    
    console.log(`✅ Get top trends function: ${topTrends.length} trends found`);
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

async function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');
  
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const optionalVars = ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'GITHUB_TOKEN'];
  
  let allGood = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Missing (required)`);
      allGood = false;
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`⚠️  ${varName}: Not configured (optional)`);
    }
  }
  
  if (!allGood) {
    console.log('\n❌ Please configure required environment variables in .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment configuration looks good!');
}

async function main() {
  console.log('🎯 TrendFeed Backend Setup');
  console.log('========================\n');
  
  // Check environment
  await checkEnvironment();
  console.log('');
  
  // Setup database
  await setupDatabase();
  console.log('');
  
  console.log('🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Start the API server: npm start');
  console.log('2. Start the data worker: npm run worker');
  console.log('3. Open your frontend and see real-time trends!');
  console.log('\nAPI will be available at: http://localhost:3001');
}

// Run setup if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupDatabase, testDatabase, checkEnvironment };
