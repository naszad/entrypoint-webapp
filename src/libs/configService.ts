'use server';

import { Configuration } from '@/models/Configurations';
import { createClient } from '@/utils/supabase/supabaseServer';
import { isValidUuid } from '@/utils/utils';

type ConfigRequest = {
  userId?: string;
  customerId?: string;
  schoolId?: string;
  configKey: string;
};


export async function fetchConfig(request: ConfigRequest): Promise<Configuration | null> {
  try {

    const supabase = await createClient();
    const { userId, schoolId, customerId, configKey } = request;
    const { data, error } = await supabase.rpc('fetch_public_config', {
      p_user_id: isValidUuid(userId) ? userId : null,
      p_school_id: isValidUuid(schoolId) ? schoolId : null,
      p_customer_id: isValidUuid(customerId) ? customerId : null,
      p_config_key: configKey,
    });
    
    if (error) throw new Error(error.message);
    if (!data) return null;
    
    return data[0];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch Configuration. Error: ${message}`);
  }
}
