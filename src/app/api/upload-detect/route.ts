import { NextRequest, NextResponse } from 'next/server';
import { detectAI } from '@/lib/ai-detector';

// 文件解析函数
async function parseFile(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop() || '';

  // TXT 文件
  if (ext === 'txt' || mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }

  // PDF 文件
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      await parser.destroy();
      return textResult.text;
    } catch {
      throw new Error('PDF解析失败，请确保文件未加密');
    }
  }

  // DOCX 文件
  if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      throw new Error('DOCX解析失败，请确保文件格式正确');
    }
  }

  // DOC 文件（旧格式，mammoth不支持，提示用户）
  if (ext === 'doc' || mimeType === 'application/msword') {
    throw new Error('暂不支持.doc格式，请转换为.docx后上传');
  }

  // Markdown
  if (ext === 'md' || mimeType === 'text/markdown') {
    // 去除markdown标记，保留纯文本
    return buffer
      .toString('utf-8')
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      .replace(/---+/g, '')
      .replace(/>\s/g, '');
  }

  throw new Error(`不支持的文件格式: ${ext || mimeType}`);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '请上传文件' },
        { status: 400 }
      );
    }

    // 检查文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过10MB' },
        { status: 400 }
      );
    }

    // 读取文件
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 解析文件内容
    const text = await parseFile(buffer, file.type, file.name);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: '文件内容过少或无法提取有效文本（至少需要50个字符）' },
        { status: 400 }
      );
    }

    // 截断过长文本
    const truncatedText = text.length > 20000 ? text.slice(0, 20000) : text;

    // 执行AI检测
    const detectionResult = detectAI(truncatedText);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        textLength: truncatedText.length,
        detection: detectionResult,
        extractedText: truncatedText,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '文件处理失败';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
