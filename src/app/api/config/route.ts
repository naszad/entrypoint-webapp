import { NextResponse } from 'next/server';
import { fetchConfig } from '@/libs/configService';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const customerId = url.searchParams.get('customerId');
    const schoolId = url.searchParams.get('schoolId');
    const configKey = url.searchParams.get('configKey');

    if (!configKey) {
      return NextResponse.json({ error: 'configKey is required' }, { status: 400 });
    }

    const configuration = await fetchConfig({
      userId: userId || undefined,
      customerId: customerId || undefined,
      schoolId: schoolId || undefined,
      configKey,
    });
    return NextResponse.json(configuration);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 