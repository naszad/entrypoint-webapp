'use server';

import { createClient } from '@/utils/supabase/supabaseServer';
import { isValidUuid } from '@/utils/utils';

type ConfigRequest = {
  userId?: string;
  customerId?: string;
  schoolId?: string;
  configKeys: string[];
};

type ConfigResponse = {
 [configKey: string]: string[];
};

export async function fetchConfig(request: ConfigRequest): Promise<ConfigResponse> {
  try {
    
    const supabase = await createClient();
    const { userId, schoolId, customerId, configKeys } = request;
    
    const configs: ConfigResponse = {};
    
    for (const configKey of configKeys) {
      const { data, error } = await supabase.rpc('fetch_public_config', {
        p_user_id: isValidUuid(userId) ? userId : null,
        p_school_id: isValidUuid(schoolId) ? schoolId : null,
        p_customer_id: isValidUuid(customerId) ? customerId : null,
        p_config_key: configKey,
      });
      
      if (error) {
        console.warn(`Failed to fetch config ${configKey}:`, error.message);
        continue;
      }
      
      if (data && data.length > 0) {
        configs[configKey] = data[0].value as string[];
      }
    };
    
    return configs;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch multiple configurations. Error: ${message}`);
  }
}

