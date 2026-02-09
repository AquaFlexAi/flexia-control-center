
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtcmVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYxNjE5MzgzNywiZXhwIjoxOTI5NTEzODM3fQ.3Suzx0RCpPmaZ6sOx9wQfZDDaWCjrVHcL26W1JGE7H4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  console.log('Creating admin user...');
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@flexia.io',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
        full_name: 'System Admin',
        role: 'system_admin'
    }
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully:', data.user.id);
    
    // Also ensure the user is in the public.users table if not automatically handled by triggers
    // Assuming there's a trigger, but let's check
  }
}

createAdmin();
