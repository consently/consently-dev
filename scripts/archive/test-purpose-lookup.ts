import { createClient } from '@/lib/supabase/server';

async function testPurposeLookup() {
  const supabase = await createClient();
  
  const purposeId = 'f8383c23-c3e1-4919-928f-5b5942071601';
  
  console.log('Testing purpose lookup with ID:', purposeId);
  
  // Test 1: Direct query without RLS (as service role)
  const { data: purpose, error } = await supabase
    .from('purposes')
    .select('id, purpose_name, is_predefined')
    .eq('id', purposeId)
    .single();
  
  console.log('Query result:', { purpose, error });
  
  // Test 2: List all purposes
  const { data: allPurposes, error: listError } = await supabase
    .from('purposes')
    .select('id, purpose_name, is_predefined')
    .eq('purpose_name', 'Account Management');
  
  console.log('Account Management purposes:', { allPurposes, listError });
}

testPurposeLookup();
