// AI文本检测引擎 - 分析文本中的AI特征并给出评分

// AI高频词汇（中文）
const AI_WORDS_ZH = [
  '此外', '然而', '因此', '总之', '首先', '其次', '最后',
  '重要', '显著', '有效', '确保', '提供', '利用', '实现',
  '促进', '增强', '优化', '关键', '需要', '可以', '应该',
  '可能', '非常', '基本', '具体', '相关', '进行', '通过',
  '根据', '目前', '同时', '特别', '已经', '以及', '关于',
  '对于', '随着', '不仅', '而且', '虽然', '如果', '因为',
  '所以', '但是', '或者', '并且',
];

// AI典型句式模式（中文）
const AI_PATTERNS_ZH = [
  /值得注意的是[，,]/g,
  /不可否认[，,]/g,
  /众所周知[，,]/g,
  /总的来说[，,]/g,
  /综上所述[，,]/g,
  /在某种程度上/g,
  /与此同时[，,]/g,
  /随着\S+的(?:发展|进步|提升)[，,]/g,
  /不仅\S+，而且\S+/g,
  /首先\S+[。.]其次\S+[。.]最后/g,
  /以下(?:是|为)?几点[：:]/g,
  /在\S+方面\S+起到了\S+作用/g,
  /对\S+产生了\S+影响/g,
  /具有\S+意义/g,
  /为\S+提供\S+保障/g,
];

// AI高频词汇（英文）
const AI_WORDS_EN = [
  'utilize', 'implement', 'facilitate', 'subsequently', 'furthermore',
  'nevertheless', 'consequently', 'additionally', 'significant', 'demonstrate',
  'approximately', 'sufficient', 'commence', 'terminate', 'acquire',
  'endeavor', 'ascertain', 'numerous', 'predominantly', 'fundamental',
  'moreover', 'hence', 'thus', 'whereas', 'notwithstanding',
  'accordingly', 'aforementioned', 'pertaining', 'encompasses',
];

// AI典型句式模式（英文）
const AI_PATTERNS_EN = [
  /it is important to note that/gi,
  /in conclusion[,.]/gi,
  /in order to/gi,
  /due to the fact that/gi,
  /in the event that/gi,
  /at this point in time/gi,
  /for the purpose of/gi,
  /it is worth mentioning that/gi,
  /plays a (?:crucial|vital|significant|pivotal) role/gi,
  /has (?:a profound|a significant|a substantial) impact/gi,
  /it can be (?:argued|observed|noted) that/gi,
  /in today'?s (?:rapidly evolving|modern|contemporary) world/gi,
  /delve into/gi,
  /navigate the (?:complexities|landscape)/gi,
  /a testament to/gi,
  /shed light on/gi,
  /the notion of/gi,
];

interface SegmentAnalysis {
  text: string;
  score: number; // 0-100, 越高越可能是AI生成
  reasons: string[];
}

interface DetectionResult {
  overallScore: number; // 0-100
  verdict: string;
  verdictColor: 'green' | 'yellow' | 'red';
  language: 'zh' | 'en';
  totalWords: number;
  totalSentences: number;
  segmentAnalysis: SegmentAnalysis[];
  features: {
    aiWordCount: number;
    aiPatternCount: number;
    avgSentenceLength: number;
    sentenceLengthVariance: number; // burstiness
    lexicalDiversity: number; // 词汇多样性
    transitionWordDensity: number; // 过渡词密度
    paragraphUniformity: number; // 段落均匀度
  };
}

// 检测语言
function detectLanguage(text: string): 'zh' | 'en' {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  const ratio = chineseChars ? chineseChars.length / text.length : 0;
  return ratio > 0.1 ? 'zh' : 'en';
}

// 计算句子长度统计
function analyzeSentenceLengths(text: string): { avg: number; variance: number } {
  // 按中英文句号/问号/感叹号分句
  const sentences = text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return { avg: 0, variance: 0 };

  const lengths = sentences.map((s) => s.trim().length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;

  return { avg, variance };
}

// 计算词汇多样性 (Type-Token Ratio)
function calcLexicalDiversity(text: string, lang: 'zh' | 'en'): number {
  let tokens: string[];

  if (lang === 'zh') {
    // 简单分词：按标点和空格分割，再按2-3字切分
    tokens = text
      .split(/[，。！？、；：""''（）\s,.\-!?;:'"()\n]+/)
      .filter((t) => t.length > 0);
    // 进一步按2字窗口切分
    const bigrams: string[] = [];
    for (const token of tokens) {
      for (let i = 0; i < token.length - 1; i++) {
        bigrams.push(token.slice(i, i + 2));
      }
    }
    tokens = bigrams;
  } else {
    tokens = text
      .toLowerCase()
      .split(/[^a-z'-]+/)
      .filter((t) => t.length > 2);
  }

  if (tokens.length === 0) return 0;
  const uniqueTokens = new Set(tokens);
  return uniqueTokens.size / tokens.length;
}

// 计算过渡词密度
function calcTransitionDensity(text: string, lang: 'zh' | 'en'): number {
  const transitions =
    lang === 'zh'
      ? ['此外', '然而', '因此', '总之', '首先', '其次', '最后', '同时', '并且', '而且', '但是', '所以', '因为', '如果', '虽然']
      : ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently', 'nevertheless', 'thus', 'hence', 'moreover', 'in addition', 'on the other hand'];

  let count = 0;
  for (const t of transitions) {
    const regex = new RegExp(t, 'gi');
    const matches = text.match(regex);
    if (matches) count += matches.length;
  }

  const wordCount = lang === 'zh' ? text.length : text.split(/\s+/).length;
  return wordCount > 0 ? count / wordCount : 0;
}

// 计算段落均匀度（AI文章段落长度往往很接近）
function calcParagraphUniformity(text: string): number {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length < 2) return 0;

  const lengths = paragraphs.map((p) => p.trim().length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  if (avg === 0) return 0;

  // 计算变异系数（CV），越低说明段落越均匀
  const stdDev = Math.sqrt(
    lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length
  );
  const cv = stdDev / avg;

  // CV越低，越可能是AI生成的（AI倾向于写等长段落）
  // CV < 0.3 高度均匀，0.3-0.6 中等，> 0.6 自然
  return Math.max(0, Math.min(1, 1 - cv));
}

// 按段落分析文本
function analyzeSegments(text: string, lang: 'zh' | 'en'): SegmentAnalysis[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const segments: SegmentAnalysis[] = [];

  for (const para of paragraphs) {
    let score = 0;
    const reasons: string[] = [];

    // 检查AI高频词
    const wordList = lang === 'zh' ? AI_WORDS_ZH : AI_WORDS_EN;
    let aiWordHits = 0;
    for (const word of wordList) {
      const regex = new RegExp(word, 'gi');
      const matches = para.match(regex);
      if (matches) aiWordHits += matches.length;
    }

    if (aiWordHits > 0) {
      const density = aiWordHits / Math.max(1, para.length / (lang === 'zh' ? 10 : 5));
      if (density > 0.3) {
        score += 30;
        reasons.push(`AI高频词密集 (${aiWordHits}个)`);
      } else if (density > 0.15) {
        score += 15;
        reasons.push(`含AI常用词 (${aiWordHits}个)`);
      }
    }

    // 检查AI句式
    const patterns = lang === 'zh' ? AI_PATTERNS_ZH : AI_PATTERNS_EN;
    let patternHits = 0;
    for (const pattern of patterns) {
      const matches = para.match(pattern);
      if (matches) patternHits += matches.length;
    }

    if (patternHits > 0) {
      score += patternHits * 15;
      reasons.push(`AI典型句式 (${patternHits}处)`);
    }

    // 检查句子长度一致性（AI倾向于写等长句子）
    const { variance } = analyzeSentenceLengths(para);
    const avgLen = para.length / Math.max(1, (para.match(/[。！？.!?]/g) || []).length);
    const normalizedVariance = variance / (avgLen * avgLen);

    if (normalizedVariance < 0.2 && para.length > 50) {
      score += 20;
      reasons.push('句子长度过于均匀');
    } else if (normalizedVariance < 0.4 && para.length > 50) {
      score += 10;
      reasons.push('句子节奏变化较少');
    }

    // 检查段落是否过于完美（无口语化特征）
    const colloquialIndicators = lang === 'zh'
      ? /[吧呢啊哦嗯嘛呀哈]/
      : /\b(well|you know|I mean|like|basically|actually|honestly)\b/i;

    if (!colloquialIndicators.test(para) && para.length > 100) {
      score += 10;
      reasons.push('缺少口语化表达');
    }

    segments.push({
      text: para,
      score: Math.min(100, score),
      reasons,
    });
  }

  return segments;
}

// 主检测函数
export function detectAI(text: string): DetectionResult {
  const lang = detectLanguage(text);
  const segments = analyzeSegments(text, lang);

  // 计算整体特征
  const wordList = lang === 'zh' ? AI_WORDS_ZH : AI_WORDS_EN;
  let aiWordCount = 0;
  for (const word of wordList) {
    const regex = new RegExp(word, 'gi');
    const matches = text.match(regex);
    if (matches) aiWordCount += matches.length;
  }

  const patternList = lang === 'zh' ? AI_PATTERNS_ZH : AI_PATTERNS_EN;
  let aiPatternCount = 0;
  for (const pattern of patternList) {
    const matches = text.match(pattern);
    if (matches) aiPatternCount += matches.length;
  }

  const { avg: avgSentenceLength, variance: sentenceLengthVariance } =
    analyzeSentenceLengths(text);
  const lexicalDiversity = calcLexicalDiversity(text, lang);
  const transitionWordDensity = calcTransitionDensity(text, lang);
  const paragraphUniformity = calcParagraphUniformity(text);

  // 综合评分算法
  let overallScore = 0;

  // AI词汇密度贡献 (0-25分)
  const totalWords = lang === 'zh' ? text.length : text.split(/\s+/).length;
  const aiWordDensity = totalWords > 0 ? aiWordCount / totalWords : 0;
  overallScore += Math.min(25, aiWordDensity * 200);

  // AI句式贡献 (0-25分)
  overallScore += Math.min(25, aiPatternCount * 8);

  // 句子长度方差贡献 (0-15分) - AI方差通常较低
  const normalizedVar = avgSentenceLength > 0 ? sentenceLengthVariance / (avgSentenceLength * avgSentenceLength) : 1;
  if (normalizedVar < 0.3) overallScore += 15;
  else if (normalizedVar < 0.5) overallScore += 10;
  else if (normalizedVar < 0.8) overallScore += 5;

  // 词汇多样性贡献 (0-15分) - AI的TTR通常较高（用词丰富但模式化）
  if (lexicalDiversity > 0.85) overallScore += 15;
  else if (lexicalDiversity > 0.75) overallScore += 10;
  else if (lexicalDiversity > 0.65) overallScore += 5;

  // 过渡词密度贡献 (0-10分)
  if (transitionWordDensity > 0.05) overallScore += 10;
  else if (transitionWordDensity > 0.03) overallScore += 7;
  else if (transitionWordDensity > 0.015) overallScore += 3;

  // 段落均匀度贡献 (0-10分)
  overallScore += paragraphUniformity * 10;

  overallScore = Math.min(100, Math.round(overallScore));

  // 判定结果
  let verdict: string;
  let verdictColor: 'green' | 'yellow' | 'red';

  if (overallScore >= 70) {
    verdict = '极可能由AI生成';
    verdictColor = 'red';
  } else if (overallScore >= 50) {
    verdict = '很可能包含AI内容';
    verdictColor = 'red';
  } else if (overallScore >= 30) {
    verdict = '可能经过AI辅助';
    verdictColor = 'yellow';
  } else if (overallScore >= 15) {
    verdict = '大概率为人类写作';
    verdictColor = 'green';
  } else {
    verdict = '高度可能为人类写作';
    verdictColor = 'green';
  }

  const sentences = text.split(/[。！？.!?]+/).filter((s) => s.trim().length > 0);

  return {
    overallScore,
    verdict,
    verdictColor,
    language: lang,
    totalWords: totalWords,
    totalSentences: sentences.length,
    segmentAnalysis: segments,
    features: {
      aiWordCount,
      aiPatternCount,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      sentenceLengthVariance: Math.round(sentenceLengthVariance * 10) / 10,
      lexicalDiversity: Math.round(lexicalDiversity * 1000) / 1000,
      transitionWordDensity: Math.round(transitionWordDensity * 10000) / 10000,
      paragraphUniformity: Math.round(paragraphUniformity * 100) / 100,
    },
  };
}
