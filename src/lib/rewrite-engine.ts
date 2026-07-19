// 内置同义词词典 - 用于替换AI常用词汇
export const SYNONYM_MAP: Record<string, string[]> = {
  // AI高频词 -> 更自然的替换
  '此外': ['另外', '除此之外', '再说', '还有', '同时'],
  '然而': ['不过', '但是', '话说回来', '只是', '倒是有个情况'],
  '因此': ['所以说', '由此可见', '这么看来', '于是', '结果就是'],
  '总之': ['说到底', '归根结底', '总而言之', '简单说', '一句话'],
  '首先': ['第一', '一来', '打头阵的是', '先说'],
  '其次': ['第二', '再者', '然后', '接下来'],
  '最后': ['末了', '最终', '说到底', '还有一点'],
  '重要': ['关键', '核心', '不能忽视的', '值得注意的'],
  '显著': ['明显', '突出', '一眼就能看出', '相当'],
  '有效': ['管用', '有用', '确实能行', '靠谱'],
  '确保': ['保证', '让...得以', '使得', '确保没问题'],
  '提供': ['给出', '带来', '供应', '奉上'],
  '利用': ['借助', '靠着', '用上', '凭借'],
  '实现': ['做到', '达成', '完成', '搞定'],
  '促进': ['推动', '助力', '带动', '加速'],
  '增强': ['加强', '提升', '强化', '增进'],
  '优化': ['改善', '改进', '打磨', '升级'],
  '关键': ['核心', '要害', '重中之重', '最要紧的'],
  '需要': ['得', '要', '有必要', '少不了'],
  '可以': ['能够', '能', '足以', '有条件'],
  '应该': ['应当', '理应', '有必要', '最好'],
  '可能': ['或许', '大概', '说不定', '有可能'],
  '非常': ['很', '特别', '相当', '挺'],
  '基本': ['大体', '差不多', '基本上', '大致'],
  '具体': ['详细', '明确', '确切', '实实在在'],
  '相关': ['有关的', '对应的', '这方面的', '涉及的'],
  '进行': ['做', '开展', '着手', '进行一番'],
  '通过': ['借助', '经由', '靠', '经过'],
  '根据': ['按照', '依据', '基于', '凭着'],
  '目前': ['眼下', '现在', '现阶段', '当前'],
  '同时': ['另外', '与此同时', '一边...一边', '并且'],
  '特别': ['尤其', '格外', '分外', ' notably'],
  '已经': ['早已', '已然', '早就', '都'],
  '以及': ['还有', '和', '加上', '连同'],
  '关于': ['说到', '谈到', '提及', '就...而言'],
  '对于': ['针对', '就...来说', '对...而言', '至于'],
  '随着': ['伴随', '跟着', '在...的同时', '当...越来越'],
  '不仅': ['不光', '非但', '不但', '何止'],
  '而且': ['还', '并且', '更', '甚至'],
  '虽然': ['尽管', '虽说', '固然', '诚然'],
  '如果': ['假如', '要是', '倘若', '万一'],
  '因为': ['由于', '鉴于', '考虑到', '毕竟'],
  '所以': ['因此', '由此可见', '这么一来', '于是'],
  '但是': ['不过', '然而', '只是', '可'],
  '或者': ['要么', '抑或', '还是', '不然就'],
  '并且': ['而且', '同时', '还', '加之'],
};

// AI典型句式模式 -> 人性化改写模板
export const SENTENCE_PATTERNS = [
  {
    // "X是一个非常重要的Y" -> 更自然的表达
    pattern: /(\S+)是一个非常重要的(\S+)/g,
    replacements: [
      '$1很关键，$2',
      '说到$1，它在$2方面相当重要',
      '$1这个$2，分量不轻',
    ],
  },
  {
    // "值得注意的是" -> 更口语化
    pattern: /值得注意的是[，,]?\s*/g,
    replacements: [
      '有个细节别忽略，',
      '有一点得说，',
      '顺便提一嘴，',
      '话说回来，',
    ],
  },
  {
    // "总的来说" / "综上所述"
    pattern: /(?:总的来说|综上所述)[，,]?\s*/g,
    replacements: [
      '说了这么多，',
      '概括一下，',
      '简单总结，',
      '一句话概括，',
    ],
  },
  {
    // "在某种程度上"
    pattern: /在某种程度上/g,
    replacements: ['多少', '或多或少', '从某个角度看', '在一定程度上'],
  },
  {
    // "与此同时"
    pattern: /与此同时[，,]?\s*/g,
    replacements: ['另一边，', '同期呢，', '与此同时呢，', '同时，'],
  },
  {
    // "不可否认"
    pattern: /不可否认[，,]?\s*/g,
    replacements: ['说实话，', '坦白讲，', '不得不承认，', '老实说，'],
  },
  {
    // "众所周知"
    pattern: /众所周知[，,]?\s*/g,
    replacements: ['大家都知道，', '这事儿人尽皆知，', '明摆着的事实是，', '地球人都知道，'],
  },
  {
    // "随着X的发展/进步"
    pattern: /随着(\S+)的(?:发展|进步|提升)[，,]?\s*/g,
    replacements: [
      '$1越来越成熟，',
      '$1这些年变化很大，',
      '如今$1日新月异，',
      '$1一路走来的变化有目共睹，',
    ],
  },
];

// 过渡词和口语化连接词
export const TRANSITIONAL_PHRASES = {
  // 段落开头可以添加的口语化过渡
  paragraphStarters: [
    '说起来，',
    '说实话，',
    '其实吧，',
    '话说回来，',
    '你想想看，',
    '这么看的话，',
    '从实际来看，',
    '换个角度说，',
    '坦白讲，',
    '依我看，',
  ],
  // 句中可以插入的语气词
  insertions: [
    '说白了',
    '换句话说',
    '打个比方',
    '也就是说',
    '你品品',
    '仔细想想',
    '事实上',
    '实际上',
  ],
  // 句末可以添加的口语化后缀
  sentenceEnders: [
    '，这一点很关键。',
    '，这是不争的事实。',
    '，大家心里都有数。',
    '，道理很简单。',
    '，这一点毋庸置疑。',
  ],
};

// 英文同义词映射 (用于英文文本)
export const EN_SYNONYM_MAP: Record<string, string[]> = {
  'utilize': ['use', 'employ', 'make use of', 'leverage'],
  'implement': ['put in place', 'carry out', 'execute', 'set up'],
  'facilitate': ['help', 'aid', 'support', 'make easier'],
  'subsequently': ['then', 'after that', 'later', 'next'],
  'furthermore': ['also', 'besides', 'on top of that', 'plus'],
  'nevertheless': ['still', 'even so', 'that said', 'but'],
  'consequently': ['so', 'as a result', 'because of this', 'therefore'],
  'additionally': ['also', 'besides', 'plus', 'on top of that'],
  'significant': ['big', 'major', 'notable', 'important'],
  'demonstrate': ['show', 'prove', 'illustrate', 'make clear'],
  'approximately': ['about', 'around', 'roughly', 'close to'],
  'sufficient': ['enough', 'adequate', 'plenty', 'satisfactory'],
  'commence': ['start', 'begin', 'kick off', 'get going'],
  'terminate': ['end', 'stop', 'finish', 'wrap up'],
  'acquire': ['get', 'obtain', 'pick up', 'gain'],
  'endeavor': ['try', 'attempt', 'strive', 'aim'],
  'ascertain': ['find out', 'determine', 'figure out', 'learn'],
  'numerous': ['many', 'a lot of', 'plenty of', 'countless'],
  'predominantly': ['mostly', 'mainly', 'largely', 'for the most part'],
  'fundamental': ['basic', 'core', 'essential', 'key'],
  'it is important to note': ['worth noting', 'keep in mind', "don't forget", 'one thing to remember'],
  'in conclusion': ['to wrap up', 'all in all', 'in short', 'bottom line'],
  'in order to': ['to', 'so as to', 'for the purpose of', 'with the aim of'],
  'due to the fact that': ['because', 'since', 'given that', 'as'],
  'in the event that': ['if', 'when', 'in case', 'should'],
  'at this point in time': ['now', 'currently', 'at present', 'right now'],
  'for the purpose of': ['to', 'for', 'in order to', 'with the goal of'],
};
