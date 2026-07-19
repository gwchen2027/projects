import { NextRequest, NextResponse } from 'next/server';
import { detectAI } from '@/lib/ai-detector';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { text?: string };
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入需要检测的文本' },
        { status: 400 }
      );
    }

    if (text.length > 20000) {
      return NextResponse.json(
        { error: '文本长度不能超过20000字符' },
        { status: 400 }
      );
    }

    if (text.trim().length < 50) {
      return NextResponse.json(
        { error: '文本过短，至少需要50个字符才能进行有效检测' },
        { status: 400 }
      );
    }

    const result = detectAI(text);

    return NextResponse.json({
      success: true,
      data: {
        detection: result,
        textLength: text.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: '检测失败，请检查输入文本' },
      { status: 500 }
    );
  }
}
