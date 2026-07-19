import { NextRequest, NextResponse } from 'next/server';
import { PROVIDERS, callProvider } from '@/lib/providers';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string;
      providerId?: string;
    };
    const { text, providerId } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入需要改写的文本' },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        { error: '请指定API提供商' },
        { status: 400 }
      );
    }

    if (providerId === 'built-in') {
      return NextResponse.json(
        { error: '内置引擎请使用 /api/rewrite 接口' },
        { status: 400 }
      );
    }

    const provider = PROVIDERS.find((p) => p.id === providerId);
    if (!provider) {
      return NextResponse.json(
        { error: `未知的提供商: ${providerId}` },
        { status: 400 }
      );
    }

    if (provider.status !== 'active' && provider.status !== 'limited') {
      return NextResponse.json(
        { error: `${provider.name} 当前不可用 (${provider.status})` },
        { status: 503 }
      );
    }

    const result = await callProvider(provider, text);

    if (result.success && result.result) {
      return NextResponse.json({
        success: true,
        data: {
          result: result.result,
          provider: provider.name,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || '改写失败',
      provider: provider.name,
    });
  } catch {
    return NextResponse.json(
      { error: '调用外部API失败' },
      { status: 500 }
    );
  }
}
