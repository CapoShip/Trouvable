import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('client_data_connectors')
    .select('client_id, provider, status, config')
    .eq('provider', 'gsc');

  if (error) {
    console.error('Error fetching connectors:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No GSC connectors found.');
    return;
  }

  for (const row of data) {
    console.log(`\nClient: ${row.client_id}`);
    console.log(`Status: ${row.status}`);
    console.log(`Config Keys: ${Object.keys(row.config || {}).join(', ')}`);
    if (row.config && row.config.google_refresh_token) {
       console.log('Refresh Token: PRESENT');
    } else {
       console.log('Refresh Token: MISSING');
    }
  }
}

check();
