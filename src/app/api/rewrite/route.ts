import { NextRequest, NextResponse } from 'next/server';
import {
  SYNONYM_MAP,
  SENTENCE_PATTERNS,
  TRANSITIONAL_PHRASES,
  EN_SYNONYM_MAP,
} from '@/lib/rewrite-engine';

// 检测文本语言
function detectLanguage(text: string): 'zh' | 'en' {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  const ratio = chineseChars ? chineseChars.length / text.length : 0;
  return ratio > 0.1 ? 'zh' : 'en';
}

// 随机选择数组元素
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 中文同义词替换
function replaceSynonymsZh(text: string, intensity: number): string {
  let result = text;
  const entries = Object.entries(SYNONYM_MAP);

  for (const [word, synonyms] of entries) {
    // intensity控制替换概率: 0.3=保守, 0.6=中等, 1.0=激进
    if (result.includes(word) && Math.random() < intensity) {
      const replacement = pickRandom(synonyms);
      result = result.replace(new RegExp(escapeRegex(word), 'g'), replacement);
    }
  }

  return result;
}

// 英文同义词替换
function replaceSynonymsEn(text: string, intensity: number): string {
  let result = text;
  const entries = Object.entries(EN_SYNONYM_MAP);

  for (const [word, synonyms] of entries) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    if (regex.test(result) && Math.random() < intensity) {
      const replacement = pickRandom(synonyms);
      result = result.replace(regex, replacement);
    }
  }

  return result;
}

// 句式重构
function restructureSentences(text: string, intensity: number): string {
  let result = text;

  for (const { pattern, replacements } of SENTENCE_PATTERNS) {
    if (Math.random() < intensity) {
      result = result.replace(pattern, () => pickRandom(replacements));
    }
  }

  return result;
}

// 添加口语化过渡词
function addTransitions(text: string, intensity: number): string {
  const paragraphs = text.split(/\n\n+/);
  const result: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    let para = paragraphs[i];

    // 给部分段落开头添加过渡词（跳过第一段）
    if (i > 0 && Math.random() < intensity * 0.4) {
      const starter = pickRandom(TRANSITIONAL_PHRASES.paragraphStarters);
      para = starter + para;
    }

    // 在段落内随机插入语气词
    if (Math.random() < intensity * 0.3) {
      const sentences = para.split(/([。！？.!?])/);
      const insertIdx = Math.floor(Math.random() * Math.max(1, sentences.length - 2));
      if (insertIdx > 0 && insertIdx < sentences.length - 1) {
        const insertion = pickRandom(TRANSITIONAL_PHRASES.insertions);
        sentences[insertIdx] = sentences[insertIdx] + '，' + insertion;
        para = sentences.join('');
      }
    }

    result.push(para);
  }

  return result.join('\n\n');
}

// 调整句子长度变化(burstiness) - 拆分长句、合并短句
function adjustBurstiness(text: string, intensity: number): string {
  // 拆分长句
  const splitLongSentences = (t: string): string => {
    // 中文：按逗号拆分超长句
    return t.replace(/([^。！？.!?]{40,}?)[，,]([^。！？.!?]{20,}?)[，,]([^。！？.!?]{10,}?)[。.!！?？]/g, (_match, p1, p2, p3) => {
      if (Math.random() < intensity * 0.5) {
        return `${p1}。${p2}。${p3}。`;
      }
      return _match;
    });
  };

  // 英文：拆分长句
  const splitLongEnSentences = (t: string): string => {
    return t.replace(/([^.!?\n]{60,}?),\s*([^.!?\n]{30,}?),\s*([^.!?\n]{15,}?)\./g, (_match, p1, p2, p3) => {
      if (Math.random() < intensity * 0.5) {
        return `${p1}. ${p2}. ${p3}.`;
      }
      return _match;
    });
  };

  let result = splitLongSentences(text);
  result = splitLongEnSentences(result);

  return result;
}

// 去除AI特征格式
function removeAIPatterns(text: string): string {
  let result = text;

  // 去除多余的"首先...其次...最后"结构
  result = result.replace(/首先[，,]?\s*/g, () => {
    const alternatives = ['一来，', '先说，', '第一步，', ''];
    return pickRandom(alternatives);
  });

  result = result.replace(/其次[，,]?\s*/g, () => {
    const alternatives = ['再者，', '然后，', '接下来，', ''];
    return pickRandom(alternatives);
  });

  result = result.replace(/最后[，,]?\s*/g, () => {
    const alternatives = ['末了，', '最后一点，', '还有一点，', ''];
    return pickRandom(alternatives);
  });

  // 去除过于工整的并列结构标记
  result = result.replace(/第一[，,]\s*/g, () => Math.random() > 0.5 ? '一来，' : '第一，');
  result = result.replace(/第二[，,]\s*/g, () => Math.random() > 0.5 ? '再者，' : '第二，');
  result = result.replace(/第三[，,]\s*/g, () => Math.random() > 0.5 ? '还有，' : '第三，');

  // 去除AI常用的冒号列表引导语
  result = result.replace(/以下(?:是|为)?几点[：:]\s*/g, () => {
    return pickRandom(['几个方面：', '具体来看：', '展开说说：', '']);
  });

  return result;
}

// 添加微小的不规则性（模拟人类写作习惯）
function addHumanImperfections(text: string, intensity: number): string {
  let result = text;
  const lang = detectLanguage(text);

  if (lang === 'zh') {
    // 偶尔使用省略号代替句号（表示语意未尽）
    if (Math.random() < intensity * 0.2) {
      result = result.replace(/。([^"]{0,5})$/, '……$1');
    }

    // 偶尔添加括号补充说明
    if (Math.random() < intensity * 0.15) {
      const phrases = ['（这一点很关键）', '（划重点）', '（别忽略）'];
      const sentences = result.split('。');
      if (sentences.length > 2) {
        const idx = Math.floor(Math.random() * (sentences.length - 1));
        sentences[idx] += pickRandom(phrases);
        result = sentences.join('。');
      }
    }
  } else {
    // 英文中偶尔用缩写
    if (Math.random() < intensity * 0.3) {
      result = result.replace(/\bdo not\b/gi, "don't");
      result = result.replace(/\bit is\b/gi, "it's");
      result = result.replace(/\bthey are\b/gi, "they're");
      result = result.replace(/\bwe are\b/gi, "we're");
      result = result.replace(/\bI am\b/g, "I'm");
      result = result.replace(/\bI have\b/g, "I've");
    }
  }

  return result;
}

// 正则转义
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 主处理函数
export function processText(
  text: string,
  options: {
    intensity: number; // 0.3-1.0 改写强度
    strategies: string[]; // 启用的策略
  }
): string {
  let result = text;
  const { intensity, strategies } = options;

  // 1. 去除AI特征格式
  if (strategies.includes('remove-patterns')) {
    result = removeAIPatterns(result);
  }

  // 2. 同义词替换
  const lang = detectLanguage(result);
  if (strategies.includes('synonym-replace')) {
    result = lang === 'zh'
      ? replaceSynonymsZh(result, intensity)
      : replaceSynonymsEn(result, intensity);
  }

  // 3. 句式重构
  if (strategies.includes('restructure')) {
    result = restructureSentences(result, intensity);
  }

  // 4. 调整句子长度变化
  if (strategies.includes('burstiness')) {
    result = adjustBurstiness(result, intensity);
  }

  // 5. 添加口语化过渡
  if (strategies.includes('transitions')) {
    result = addTransitions(result, intensity);
  }

  // 6. 添加人类写作不规则性
  if (strategies.includes('imperfections')) {
    result = addHumanImperfections(result, intensity);
  }

  return result;
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string;
      intensity?: number;
      strategies?: string[];
    };
    const { text, intensity = 0.6, strategies = [] } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入需要改写的文本' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: '文本长度不能超过10000字符' },
        { status: 400 }
      );
    }

    // 默认策略
    const defaultStrategies = [
      'remove-patterns',
      'synonym-replace',
      'restructure',
      'burstiness',
      'transitions',
      'imperfections',
    ];

    const activeStrategies = strategies.length > 0 ? strategies : defaultStrategies;

    const result = processText(text, {
      intensity: Math.max(0.1, Math.min(1.0, intensity)),
      strategies: activeStrategies,
    });

    // 计算改写统计
    const originalChars = text.length;
    const resultChars = result.length;
    const changeRate = Math.abs(((resultChars - originalChars) / originalChars) * 100);

    const lang = detectLanguage(text);

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        result,
        stats: {
          originalLength: originalChars,
          resultLength: resultChars,
          changeRate: Math.round(changeRate * 10) / 10,
          language: lang,
          intensity,
          strategiesUsed: activeStrategies,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: '处理失败，请检查输入文本' },
      { status: 500 }
    );
  }
}
