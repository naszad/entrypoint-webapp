'use client'

import { useEffect } from 'react'
import { initMixpanel } from '@/libs/mixpanelClient'

export default function MixpanelProvider() {

  useEffect(() => {
    initMixpanel();
  }, []);

  return null
}
