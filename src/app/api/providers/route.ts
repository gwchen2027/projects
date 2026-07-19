import { NextResponse } from 'next/server';
import { PROVIDERS } from '@/lib/providers';

export async function GET() {
  const providers = PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    free: p.free,
    rateLimit: p.rateLimit,
    supportedLanguages: p.supportedLanguages,
    status: p.status,
  }));

  return NextResponse.json({
    success: true,
    data: providers,
  });
}
