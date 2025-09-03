import { NextResponse } from 'next/server';
import { fetchConfig } from '@/libs/configService';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const customerId = url.searchParams.get('customerId');
    const schoolId = url.searchParams.get('schoolId');
    const configKeys = url.searchParams.get('configKeys');

    if (!configKeys) {
      return NextResponse.json({ error: 'at least one configKey is required' }, { status: 400 });
    }

    const configurations = await fetchConfig({
      userId: userId || undefined,
      customerId: customerId || undefined,
      schoolId: schoolId || undefined,
      configKeys: configKeys.split(',').map(key => key.trim()),
    });
    return NextResponse.json(configurations);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 