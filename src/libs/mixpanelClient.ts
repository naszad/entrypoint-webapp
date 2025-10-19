declare global {
  interface Window {
    mixpanel: typeof mixpanel;
  }
}
import mixpanel from 'mixpanel-browser';
import { loadSelectedSchool } from '@/utils/selectedSchoolStorage';

type MixpanelEventProps = Record<string, string | number | boolean | string[] | null | undefined>;
type MixpanelUserProps = Record<string, string | number | boolean | null | undefined>;

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let isInitialized = false;
// Buffer events that fire before Mixpanel is ready; flushed after init succeeds.
let pendingEvents: Array<{ name: string; props?: MixpanelEventProps }> = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readCookie(name: string): string | undefined {
  if (!isBrowser()) return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function registerSessionContext() {
  if (!isInitialized) return;
  const storedSchool = loadSelectedSchool();
  const customerId = storedSchool?.customerId || readCookie('customer_id');
  const schoolId = storedSchool?.schoolId || readCookie('selectedSchoolId');
  const props: Record<string, string> = {};
  if (customerId) {
    props.customer_id = customerId;
  } else {
    mixpanel.unregister('customer_id');
  }
  if (schoolId) {
    props.school_id = schoolId;
  } else {
    mixpanel.unregister('school_id');
  }
  if (storedSchool?.customerName) {
    props.customer_name = storedSchool.customerName;
  } else {
    mixpanel.unregister('customer_name');
  }
  if (storedSchool?.name) {
    props.school_name = storedSchool.name;
  } else {
    mixpanel.unregister('school_name');
  }
  if (Object.keys(props).length > 0) {
    mixpanel.register(props);
  }
}

// Schedule a microtask-time flush so rapid fire events coalesce into one drain.
function scheduleFlush() {
  if (!isBrowser()) return;
  if (flushTimeout !== null) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushPendingEvents();
  }, 0);
}

// Attempt to drain the queue; if Mixpanel still is not ready we reschedule.
function flushPendingEvents() {
  if (!pendingEvents.length) return;
  if (!ensureReady()) {
    scheduleFlush();
    return;
  }

  const queued = pendingEvents;
  pendingEvents = [];
  queued.forEach(({ name, props }) => {
    try {
      mixpanel.track(name, props);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Mixpanel track failed (flush)', error);
      }
    }
  });
}

export const initMixpanel = () => {
  if (!isBrowser()) return;
  if (isInitialized) return;

  if (!MIXPANEL_TOKEN) {
    //Silently fail if no token is configured
    return;
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      autocapture: false,
      ignore_dnt: true,
      api_host: '/api/track',
    });
    isInitialized = true;
    registerSessionContext();
    // Any events fired during bootstrap are replayed once init finishes.
    flushPendingEvents();

    if (process.env.NODE_ENV === 'development') {
      window.mixpanel = mixpanel;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to initialize Mixpanel', error);
    }
    isInitialized = false;
  }
};

function ensureReady(): boolean {
  if (!isInitialized) {
    initMixpanel();
    if (!isInitialized) {
      //Silently fail if still not initialized
      return false;
    }
  }

  const token = mixpanel.get_config?.('token') || (mixpanel as unknown as { config?: { token?: string } }).config?.token;
  if (!token) {
    //Silently fail if no token is configured
    return false;
  }

  return true;
}

export const refreshSuperProperties = () => {
  if (!isInitialized) return;
  registerSessionContext();
};

export const registerSuperProperties = (props: MixpanelEventProps) => {
  if (!props || Object.keys(props).length === 0) return;
  if (!ensureReady()) return;
  try {
    mixpanel.register(props);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Mixpanel register failed', error);
    }
  }
};

export const identifyUser = (
  distinctId: string,
  traits?: MixpanelUserProps
) => {
  if (!ensureReady()) return;
  try {
    mixpanel.identify(distinctId);
    if (traits && Object.keys(traits).length > 0) {
      mixpanel.people.set(traits);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Mixpanel identify failed', error);
    }
  }
};

export const resetMixpanel = () => {
  if (!isBrowser()) return;
  try {
    mixpanel.reset();
    // After reset the library keeps the token, so we mark initialized and
    // refresh context to keep cookies/session in sync.
    isInitialized = true;
    registerSessionContext();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Mixpanel reset failed', error);
    }
  }
};

export const trackEvent = (
  name: string,
  props?: MixpanelEventProps
): boolean => {
  if (!ensureReady()) {
    pendingEvents.push({ name, props });
    scheduleFlush();
    return false;
  }

  if (pendingEvents.length) {
    // Process older queued events before the current call so ordering is preserved.
    flushPendingEvents();
  }
  try {
    mixpanel.track(name, props);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Mixpanel track failed', error);
    }
    return false;
  }
};
