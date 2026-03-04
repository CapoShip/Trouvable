import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing DB Insert with new columns...");
    const { error } = await supabase.from('leads').insert([{
        name: 'Diag Test',
        email: 'test@test.com',
        message: 'testing schema',
        page_path: '/test'
    }]);

    if (error) {
        console.error("DB ERROR DETAILS:");
        console.error(error);
    } else {
        console.log("Insert successful!");
    }
}
test();
