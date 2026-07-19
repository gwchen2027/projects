// 第三方免费降AI API提供商配置
export interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  bodyTemplate?: (text: string) => Record<string, unknown>;
  responsePath: string; // JSON path to extract result
  free: boolean;
  rateLimit?: string;
  supportedLanguages: ('zh' | 'en')[];
  status: 'active' | 'deprecated' | 'limited';
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'built-in',
    name: '内置改写引擎',
    description: '本地同义词替换 + 句式重构 + 口语化处理，无需网络请求',
    baseUrl: '',
    method: 'POST',
    responsePath: 'result',
    free: true,
    supportedLanguages: ['zh', 'en'],
    status: 'active',
  },
  {
    id: 'quillbot',
    name: 'QuillBot Paraphraser',
    description: '知名改写工具，支持多种改写模式',
    baseUrl: 'https://api.quillbot.com/paraphrase',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    bodyTemplate: (text: string) => ({
      text,
      mode: 'standard',
      strength: 2,
    }),
    responsePath: 'paraphrased',
    free: true,
    rateLimit: '有限免费额度',
    supportedLanguages: ['en'],
    status: 'limited',
  },
  {
    id: 'paraphrasetool',
    name: 'ParaphraseTool API',
    description: '免费文本改写接口',
    baseUrl: 'https://api.paraphrasetool.com/v1/paraphrase',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    bodyTemplate: (text: string) => ({
      text,
      strength: 'medium',
      language: 'auto',
    }),
    responsePath: 'result.text',
    free: true,
    rateLimit: '每日50次',
    supportedLanguages: ['zh', 'en'],
    status: 'limited',
  },
  {
    id: 'rewordify',
    name: 'Rewordify',
    description: '文本简化和改写服务',
    baseUrl: 'https://api.rewordify.com/rewrite',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    bodyTemplate: (text: string) => ({
      text,
      complexity: 0.5,
    }),
    responsePath: 'rewritten',
    free: true,
    rateLimit: '每日30次',
    supportedLanguages: ['en'],
    status: 'limited',
  },
  {
    id: 'textspinner',
    name: 'TextSpinner',
    description: '开源文本旋转工具',
    baseUrl: 'https://api.textspinner.com/v1/spin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    bodyTemplate: (text: string) => ({
      text,
      creativity: 0.7,
    }),
    responsePath: 'spun_text',
    free: true,
    rateLimit: '每日100次',
    supportedLanguages: ['zh', 'en'],
    status: 'limited',
  },
  {
    id: 'wordtune',
    name: 'WordTune Rewrite',
    description: '智能改写引擎',
    baseUrl: 'https://api.wordtune.com/rewrite',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    bodyTemplate: (text: string) => ({
      text,
      mode: 'casual',
    }),
    responsePath: 'rewrites.0.text',
    free: true,
    rateLimit: '每日20次',
    supportedLanguages: ['en'],
    status: 'limited',
  },
];

// 从嵌套对象中按路径取值
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// 调用第三方Provider
export async function callProvider(
  provider: ProviderConfig,
  text: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  if (provider.id === 'built-in') {
    return { success: false, error: '内置引擎请使用本地处理' };
  }

  try {
    const body = provider.bodyTemplate ? provider.bodyTemplate(text) : { text };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(provider.baseUrl, {
      method: provider.method,
      headers: provider.headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        error: `${provider.name} 返回 HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as Record<string, unknown>;
    const result = getNestedValue(data, provider.responsePath);

    if (typeof result === 'string' && result.length > 0) {
      return { success: true, result };
    }

    return {
      success: false,
      error: `${provider.name} 返回数据格式异常`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    return {
      success: false,
      error: `${provider.name} 请求失败: ${message}`,
    };
  }
}

// 尝试所有可用Provider，返回第一个成功的结果
export async function tryAllProviders(
  text: string,
  excludeIds: string[] = []
): Promise<{ provider: string; result: string } | { error: string }> {
  const available = PROVIDERS.filter(
    (p) => p.id !== 'built-in' && p.status === 'active' && !excludeIds.includes(p.id)
  );

  for (const provider of available) {
    const res = await callProvider(provider, text);
    if (res.success && res.result) {
      return { provider: provider.name, result: res.result };
    }
  }

  return { error: '所有外部API均不可用，请尝试使用内置引擎' };
}
