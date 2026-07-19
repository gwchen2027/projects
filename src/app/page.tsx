'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Settings2,
  Zap,
  Globe,
  Shield,
  ArrowRight,
  Loader2,
  Upload,
  FileText,
  Search,
  AlertTriangle,
  FileUp,
  X,
} from 'lucide-react';

// ====== 类型定义 ======
interface RewriteStats {
  originalLength: number;
  resultLength: number;
  changeRate: number;
  language: string;
  intensity: number;
  strategiesUsed: string[];
}

interface Provider {
  id: string;
  name: string;
  description: string;
  free: boolean;
  rateLimit?: string;
  supportedLanguages: string[];
  status: string;
}

interface SegmentAnalysis {
  text: string;
  score: number;
  reasons: string[];
}

interface DetectionFeatures {
  aiWordCount: number;
  aiPatternCount: number;
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  lexicalDiversity: number;
  transitionWordDensity: number;
  paragraphUniformity: number;
}

interface DetectionResult {
  overallScore: number;
  verdict: string;
  verdictColor: 'green' | 'yellow' | 'red';
  language: 'zh' | 'en';
  totalWords: number;
  totalSentences: number;
  segmentAnalysis: SegmentAnalysis[];
  features: DetectionFeatures;
}

// ====== 常量 ======
const STRATEGIES = [
  { id: 'remove-patterns', label: '去除AI格式', desc: '移除AI常见的结构化表达' },
  { id: 'synonym-replace', label: '同义词替换', desc: '替换AI高频词汇为自然用词' },
  { id: 'restructure', label: '句式重构', desc: '打破AI固定的句式模板' },
  { id: 'burstiness', label: '节奏变化', desc: '调整句子长短，增加burstiness' },
  { id: 'transitions', label: '口语过渡', desc: '添加人性化的过渡词和语气' },
  { id: 'imperfections', label: '人类痕迹', desc: '添加微小的不规则性模拟手写' },
];

const ACCEPTED_FILE_TYPES = '.txt,.pdf,.docx,.md,.doc';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function Home() {
  // 模式切换
  const [mode, setMode] = useState<'rewrite' | 'detect'>('rewrite');

  // 改写相关状态
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [intensity, setIntensity] = useState([0.6]);
  const [activeStrategies, setActiveStrategies] = useState<string[]>(
    STRATEGIES.map((s) => s.id)
  );
  const [selectedProvider, setSelectedProvider] = useState('built-in');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<RewriteStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // 检测相关状态
  const [detectText, setDetectText] = useState('');
  const [detectResult, setDetectResult] = useState<DetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [detectCopied, setDetectCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载Provider列表
  useEffect(() => {
    fetch('/api/providers')
      .then((res) => res.json())
      .then((data: { success: boolean; data: Provider[] }) => {
        if (data.success) setProviders(data.data);
      })
      .catch(() => {});
  }, []);

  // ====== 改写功能 ======
  const handleRewrite = useCallback(async () => {
    if (!inputText.trim()) {
      setError('请先输入需要改写的文本');
      return;
    }
    setIsProcessing(true);
    setError(null);
    setOutputText('');
    setStats(null);

    try {
      const endpoint = selectedProvider === 'built-in' ? '/api/rewrite' : '/api/external-rewrite';
      const body = selectedProvider === 'built-in'
        ? { text: inputText, intensity: intensity[0], strategies: activeStrategies }
        : { text: inputText, providerId: selectedProvider };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        success?: boolean;
        data?: { result: string; stats?: RewriteStats };
        error?: string;
      };

      if (data.success && data.data) {
        const result = data.data.result;
        let displayed = '';
        const chunkSize = Math.max(1, Math.floor(result.length / 60));
        for (let i = 0; i < result.length; i += chunkSize) {
          displayed += result.slice(i, i + chunkSize);
          setOutputText(displayed);
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        setOutputText(result);
        if (data.data.stats) setStats(data.data.stats);
        setActiveTab('output');
      } else {
        setError(data.error || '改写失败，请重试');
      }
    } catch {
      setError('网络请求失败，请检查连接后重试');
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, selectedProvider, intensity, activeStrategies]);

  const handleCopy = useCallback(async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [outputText]);

  const handleReset = useCallback(() => {
    setInputText('');
    setOutputText('');
    setStats(null);
    setError(null);
    setActiveTab('input');
  }, []);

  const toggleStrategy = useCallback((id: string) => {
    setActiveStrategies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  // ====== 检测功能 ======
  const handleDetect = useCallback(async (text?: string) => {
    const textToDetect = text || detectText;
    if (!textToDetect.trim()) {
      setDetectError('请先输入或上传需要检测的文本');
      return;
    }
    if (textToDetect.trim().length < 50) {
      setDetectError('文本过短，至少需要50个字符才能进行有效检测');
      return;
    }

    setIsDetecting(true);
    setDetectError(null);
    setDetectResult(null);

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToDetect }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        data?: { detection: DetectionResult };
        error?: string;
      };

      if (data.success && data.data) {
        setDetectResult(data.data.detection);
      } else {
        setDetectError(data.error || '检测失败，请重试');
      }
    } catch {
      setDetectError('网络请求失败，请检查连接后重试');
    } finally {
      setIsDetecting(false);
    }
  }, [detectText]);

  // 文件上传处理
  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setDetectError('文件大小不能超过10MB');
      return;
    }

    setIsDetecting(true);
    setDetectError(null);
    setDetectResult(null);
    setUploadedFile({ name: file.name, size: file.size });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-detect', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as {
        success?: boolean;
        data?: {
          detection: DetectionResult;
          extractedText: string;
          fileName: string;
          fileSize: number;
          textLength: number;
        };
        error?: string;
      };

      if (data.success && data.data) {
        setDetectResult(data.data.detection);
        setDetectText(data.data.extractedText);
      } else {
        setDetectError(data.error || '文件处理失败');
        setUploadedFile(null);
      }
    } catch {
      setDetectError('文件上传失败，请重试');
      setUploadedFile(null);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    // 清空input以允许重复上传同一文件
    e.target.value = '';
  }, [handleFileUpload]);

  const clearUploadedFile = useCallback(() => {
    setUploadedFile(null);
    setDetectText('');
    setDetectResult(null);
  }, []);

  const copyDetectText = useCallback(async () => {
    if (detectText) {
      await navigator.clipboard.writeText(detectText);
      setDetectCopied(true);
      setTimeout(() => setDetectCopied(false), 2000);
    }
  }, [detectText]);

  const charCount = inputText.length;
  const maxChars = 10000;
  const detectCharCount = detectText.length;

  // 评分颜色
  const scoreColor = (score: number) => {
    if (score >= 70) return '#ef4444';
    if (score >= 50) return '#f59e0b';
    if (score >= 30) return '#d4a039';
    return '#2dd4a8';
  };

  const segmentBg = (score: number) => {
    if (score >= 70) return 'bg-red-500/10 border-red-500/20';
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-[#0a0a0f]/50 border-[#1e1e2e]';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e6e3]">
      {/* Header */}
      <header className="border-b border-[#1e1e2e] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4a039] to-[#b8860b] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-wide text-[#e8e6e3]">
                  DeAI<span className="text-[#d4a039]">Craft</span>
                </h1>
                <p className="text-xs text-[#8a8a9a] -mt-0.5">AI痕迹消除工坊</p>
              </div>
            </div>

            {/* 模式切换 */}
            <div className="flex items-center gap-2 bg-[#12121a] rounded-lg p-1 border border-[#1e1e2e]">
              <button
                onClick={() => setMode('rewrite')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  mode === 'rewrite'
                    ? 'bg-[#d4a039]/20 text-[#d4a039]'
                    : 'text-[#8a8a9a] hover:text-[#e8e6e3]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                改写降AI
              </button>
              <button
                onClick={() => setMode('detect')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  mode === 'detect'
                    ? 'bg-[#2dd4a8]/20 text-[#2dd4a8]'
                    : 'text-[#8a8a9a] hover:text-[#e8e6e3]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                AI检测
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="border-[#2dd4a8]/30 text-[#2dd4a8] text-xs">
                <Globe className="w-3 h-3 mr-1" />
                全球API聚合
              </Badge>
              <Badge variant="outline" className="border-[#d4a039]/30 text-[#d4a039] text-xs">
                <Zap className="w-3 h-3 mr-1" />
                免费使用
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ==================== 改写模式 ==================== */}
        {mode === 'rewrite' && (
          <>
            {/* 功能说明区 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
                <div className="w-8 h-8 rounded-md bg-[#d4a039]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#d4a039]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#e8e6e3]">智能改写</h3>
                  <p className="text-xs text-[#8a8a9a] mt-1">6种策略组合，从词汇到句式全方位人性化处理</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
                <div className="w-8 h-8 rounded-md bg-[#2dd4a8]/10 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-[#2dd4a8]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#e8e6e3]">全球API</h3>
                  <p className="text-xs text-[#8a8a9a] mt-1">聚合全球免费降AI服务，一键调用多个引擎</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
                <div className="w-8 h-8 rounded-md bg-[#d4a039]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[#d4a039]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#e8e6e3]">隐私安全</h3>
                  <p className="text-xs text-[#8a8a9a] mt-1">内置引擎本地处理，数据不上传第三方服务器</p>
                </div>
              </div>
            </div>

            {/* 主工作区 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                {/* 移动端Tab */}
                <div className="flex lg:hidden gap-2">
                  <button
                    onClick={() => setActiveTab('input')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'input'
                        ? 'bg-[#d4a039]/20 text-[#d4a039] border border-[#d4a039]/30'
                        : 'bg-[#12121a] text-[#8a8a9a] border border-[#1e1e2e]'
                    }`}
                  >
                    原文输入
                  </button>
                  <button
                    onClick={() => setActiveTab('output')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'output'
                        ? 'bg-[#2dd4a8]/20 text-[#2dd4a8] border border-[#2dd4a8]/30'
                        : 'bg-[#12121a] text-[#8a8a9a] border border-[#1e1e2e]'
                    }`}
                  >
                    改写结果
                  </button>
                </div>

                {/* 输入区 */}
                <div className={`${activeTab === 'input' ? 'block' : 'hidden'} lg:block`}>
                  <Card className="bg-[#12121a] border-[#1e1e2e]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-medium text-[#e8e6e3]">原文输入</CardTitle>
                          <Badge variant="outline" className="text-xs text-[#8a8a9a] border-[#1e1e2e]">
                            {charCount}/{maxChars}
                          </Badge>
                        </div>
                        {inputText && (
                          <button onClick={handleReset} className="text-xs text-[#8a8a9a] hover:text-[#d4a039] transition-colors flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> 清空
                          </button>
                        )}
                      </div>
                      <CardDescription className="text-xs text-[#8a8a9a]">粘贴AI生成的文本，支持中英文</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        value={inputText}
                        onChange={(e) => { if (e.target.value.length <= maxChars) setInputText(e.target.value); }}
                        placeholder="在此粘贴需要降低AI检测率的文本内容...&#10;&#10;支持中文和英文文本。内置引擎将在本地完成所有处理，您的文本不会上传到任何第三方服务器。"
                        className="w-full h-64 sm:h-80 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-4 text-sm text-[#e8e6e3] placeholder:text-[#4a4a5a] resize-none focus:outline-none focus:border-[#d4a039]/50 focus:ring-1 focus:ring-[#d4a039]/20 transition-colors"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 输出区 */}
                <div className={`${activeTab === 'output' ? 'block' : 'hidden'} lg:block`}>
                  <Card className="bg-[#12121a] border-[#1e1e2e]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-[#e8e6e3]">改写结果</CardTitle>
                        {outputText && (
                          <button onClick={handleCopy} className="text-xs text-[#8a8a9a] hover:text-[#2dd4a8] transition-colors flex items-center gap-1">
                            {copied ? (
                              <><Check className="w-3 h-3 text-[#2dd4a8]" /><span className="text-[#2dd4a8]">已复制</span></>
                            ) : (
                              <><Copy className="w-3 h-3" /> 复制</>
                            )}
                          </button>
                        )}
                      </div>
                      {stats && (
                        <CardDescription className="text-xs text-[#8a8a9a] flex items-center gap-3 flex-wrap">
                          <span>字数: {stats.originalLength} → {stats.resultLength}</span>
                          <span>变化率: {stats.changeRate}%</span>
                          <span>语言: {stats.language === 'zh' ? '中文' : '英文'}</span>
                          <span>策略: {stats.strategiesUsed.length}项</span>
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <textarea
                        ref={outputRef}
                        value={outputText}
                        readOnly
                        placeholder="改写后的文本将在这里显示..."
                        className="w-full h-64 sm:h-80 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-4 text-sm text-[#e8e6e3] placeholder:text-[#4a4a5a] resize-none focus:outline-none"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* 操作按钮 */}
                <Button
                  onClick={handleRewrite}
                  disabled={isProcessing || !inputText.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#d4a039] to-[#b8860b] hover:from-[#e0ad42] hover:to-[#c9930f] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#d4a039]/20"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在改写中...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> 开始改写 <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
                )}

                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] text-center">
                      <div className="text-lg font-bold text-[#d4a039]">{stats.changeRate}%</div>
                      <div className="text-xs text-[#8a8a9a] mt-1">文本变化率</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] text-center">
                      <div className="text-lg font-bold text-[#2dd4a8]">{stats.strategiesUsed.length}</div>
                      <div className="text-xs text-[#8a8a9a] mt-1">启用策略</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] text-center">
                      <div className="text-lg font-bold text-[#e8e6e3]">{stats.language === 'zh' ? '中' : 'EN'}</div>
                      <div className="text-xs text-[#8a8a9a] mt-1">检测语言</div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#12121a] border border-[#1e1e2e] text-center">
                      <div className="text-lg font-bold text-[#e8e6e3]">
                        {stats.intensity >= 0.8 ? '激进' : stats.intensity >= 0.5 ? '中等' : '保守'}
                      </div>
                      <div className="text-xs text-[#8a8a9a] mt-1">改写强度</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧控制面板 */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="bg-[#12121a] border-[#1e1e2e]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#d4a039]" /> 改写引擎
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger className="bg-[#0a0a0f] border-[#1e1e2e] text-[#e8e6e3]">
                        <SelectValue placeholder="选择改写引擎" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#12121a] border-[#1e1e2e]">
                        {(providers.length > 0 ? providers : [
                          { id: 'built-in', name: '内置改写引擎', status: 'active' },
                          { id: 'quillbot', name: 'QuillBot', status: 'limited' },
                          { id: 'paraphrasetool', name: 'ParaphraseTool', status: 'limited' },
                          { id: 'textspinner', name: 'TextSpinner', status: 'limited' },
                          { id: 'wordtune', name: 'WordTune', status: 'limited' },
                        ]).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              <span>{p.name}</span>
                              {p.status === 'limited' && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-[#f59e0b]/30 text-[#f59e0b]">限量</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProvider !== 'built-in' ? (
                      <p className="text-xs text-[#8a8a9a]">外部API可能受频率限制，如失败请切换回内置引擎</p>
                    ) : (
                      <p className="text-xs text-[#2dd4a8]">本地处理，数据不离开您的设备</p>
                    )}
                  </CardContent>
                </Card>

                {selectedProvider === 'built-in' && (
                  <>
                    <Card className="bg-[#12121a] border-[#1e1e2e]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                          <Zap className="w-4 h-4 text-[#d4a039]" /> 改写强度
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#8a8a9a]">保守</span>
                            <span className="text-[#d4a039] font-medium">{Math.round(intensity[0] * 100)}%</span>
                            <span className="text-[#8a8a9a]">激进</span>
                          </div>
                          <Slider value={intensity} onValueChange={setIntensity} min={0.1} max={1.0} step={0.1} />
                          <p className="text-xs text-[#8a8a9a]">
                            {intensity[0] <= 0.3 ? '仅做微调，保留原文大部分结构'
                              : intensity[0] <= 0.6 ? '适度改写，平衡自然度和原意'
                              : intensity[0] <= 0.8 ? '深度改写，大幅改变表达方式'
                              : '极限改写，最大程度消除AI痕迹'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#12121a] border-[#1e1e2e]">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                            <Settings2 className="w-4 h-4 text-[#d4a039]" /> 改写策略
                          </CardTitle>
                          <button onClick={() => setShowSettings(!showSettings)} className="text-xs text-[#8a8a9a] hover:text-[#d4a039] transition-colors lg:hidden">
                            {showSettings ? '收起' : '展开'}
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className={`space-y-3 ${!showSettings ? 'hidden lg:block' : ''}`}>
                        {STRATEGIES.map((strategy) => (
                          <label key={strategy.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[#0a0a0f]/50 cursor-pointer transition-colors group">
                            <Checkbox
                              checked={activeStrategies.includes(strategy.id)}
                              onCheckedChange={() => toggleStrategy(strategy.id)}
                              className="mt-0.5 border-[#1e1e2e] data-[state=checked]:bg-[#d4a039] data-[state=checked]:border-[#d4a039]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-[#e8e6e3] group-hover:text-[#d4a039] transition-colors">{strategy.label}</div>
                              <div className="text-xs text-[#8a8a9a] mt-0.5">{strategy.desc}</div>
                            </div>
                          </label>
                        ))}
                        <div className="pt-2 border-t border-[#1e1e2e] flex gap-2">
                          <button onClick={() => setActiveStrategies(STRATEGIES.map((s) => s.id))} className="text-xs text-[#d4a039] hover:underline">全选</button>
                          <span className="text-xs text-[#1e1e2e]">|</span>
                          <button onClick={() => setActiveStrategies([])} className="text-xs text-[#8a8a9a] hover:underline">清空</button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ==================== 检测模式 ==================== */}
        {mode === 'detect' && (
          <>
            {/* 检测模式说明 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
                <div className="w-8 h-8 rounded-md bg-[#2dd4a8]/10 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-[#2dd4a8]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#e8e6e3]">AI痕迹检测</h3>
                  <p className="text-xs text-[#8a8a9a] mt-1">多维度分析文本特征，精准识别AI生成内容</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
                <div className="w-8 h-8 rounded-md bg-[#d4a039]/10 flex items-center justify-center shrink-0">
                  <FileUp className="w-4 h-4 text-[#d4a039]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#e8e6e3]">文档上传</h3>
                  <p className="text-xs text-[#8a8a9a] mt-1">支持 TXT / PDF / DOCX / Markdown 格式</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#12121a] border border-[#1e1e2e]">
                <div className="w-8 h-8 rounded-md bg-[#d4a039]/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-[#d4a039]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#e8e6e3]">段落标记</h3>
                  <p className="text-xs text-[#8a8a9a] mt-1">逐段分析，高亮显示可疑AI生成段落</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 左侧：输入/结果 */}
              <div className="lg:col-span-8 space-y-4">
                {/* 文件上传区 */}
                <Card className="bg-[#12121a] border-[#1e1e2e]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#d4a039]" />
                      上传文档检测
                    </CardTitle>
                    <CardDescription className="text-xs text-[#8a8a9a]">
                      支持 TXT / PDF / DOCX / Markdown，最大 10MB
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-[#d4a039] bg-[#d4a039]/5'
                          : 'border-[#1e1e2e] hover:border-[#d4a039]/50 hover:bg-[#0a0a0f]/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      {uploadedFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-[#d4a039]" />
                          <div className="text-left">
                            <div className="text-sm text-[#e8e6e3] font-medium">{uploadedFile.name}</div>
                            <div className="text-xs text-[#8a8a9a]">
                              {(uploadedFile.size / 1024).toFixed(1)} KB - 已解析完成
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); clearUploadedFile(); }}
                            className="ml-2 p-1 rounded hover:bg-[#1e1e2e] text-[#8a8a9a] hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className={`w-10 h-10 mx-auto ${isDragging ? 'text-[#d4a039]' : 'text-[#4a4a5a]'}`} />
                          <div className="text-sm text-[#8a8a9a]">
                            拖拽文件到此处，或 <span className="text-[#d4a039]">点击上传</span>
                          </div>
                          <div className="text-xs text-[#4a4a5a]">TXT / PDF / DOCX / MD</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 文本输入区 */}
                <Card className="bg-[#12121a] border-[#1e1e2e]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-[#e8e6e3]">文本检测</CardTitle>
                        <Badge variant="outline" className="text-xs text-[#8a8a9a] border-[#1e1e2e]">
                          {detectCharCount} 字
                        </Badge>
                      </div>
                      {detectText && (
                        <div className="flex items-center gap-2">
                          <button onClick={copyDetectText} className="text-xs text-[#8a8a9a] hover:text-[#2dd4a8] transition-colors flex items-center gap-1">
                            {detectCopied ? (
                              <><Check className="w-3 h-3 text-[#2dd4a8]" /><span className="text-[#2dd4a8]">已复制</span></>
                            ) : (
                              <><Copy className="w-3 h-3" />复制文本</>
                            )}
                          </button>
                          <button onClick={() => { setDetectText(''); setDetectResult(null); }} className="text-xs text-[#8a8a9a] hover:text-[#d4a039] transition-colors flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> 清空
                          </button>
                        </div>
                      )}
                    </div>
                    <CardDescription className="text-xs text-[#8a8a9a]">
                      直接粘贴文本或上传文档后自动填充，至少50字
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={detectText}
                      onChange={(e) => setDetectText(e.target.value)}
                      placeholder="在此粘贴需要检测的文本...&#10;&#10;或者上传文档（TXT/PDF/DOCX/MD），系统会自动提取文本并进行AI检测分析。"
                      className="w-full h-48 sm:h-64 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-4 text-sm text-[#e8e6e3] placeholder:text-[#4a4a5a] resize-none focus:outline-none focus:border-[#2dd4a8]/50 focus:ring-1 focus:ring-[#2dd4a8]/20 transition-colors"
                    />
                  </CardContent>
                </Card>

                {/* 检测按钮 */}
                <Button
                  onClick={() => handleDetect()}
                  disabled={isDetecting || !detectText.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#2dd4a8] to-[#1aab88] hover:from-[#3de0b4] hover:to-[#22c498] text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2dd4a8]/20"
                >
                  {isDetecting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在分析中...</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" /> 开始AI检测 <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                {detectError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{detectError}</div>
                )}

                {/* 检测结果 */}
                {detectResult && (
                  <div className="space-y-4">
                    {/* 总分卡片 */}
                    <Card className="bg-[#12121a] border-[#1e1e2e] overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                          {/* 评分圆环 */}
                          <div className="relative w-24 h-24 shrink-0">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#1e1e2e" strokeWidth="8" />
                              <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke={scoreColor(detectResult.overallScore)}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${detectResult.overallScore * 2.64} 264`}
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold" style={{ color: scoreColor(detectResult.overallScore) }}>
                                {detectResult.overallScore}
                              </span>
                            </div>
                          </div>

                          {/* 判定信息 */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-lg font-bold"
                                style={{ color: scoreColor(detectResult.overallScore) }}
                              >
                                {detectResult.verdict}
                              </span>
                            </div>
                            <div className="text-xs text-[#8a8a9a] space-y-1">
                              <div className="flex items-center gap-4 flex-wrap">
                                <span>语言: {detectResult.language === 'zh' ? '中文' : 'English'}</span>
                                <span>字数: {detectResult.totalWords}</span>
                                <span>句数: {detectResult.totalSentences}</span>
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span>AI高频词: {detectResult.features.aiWordCount}个</span>
                                <span>AI句式: {detectResult.features.aiPatternCount}处</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 特征分析 */}
                    <Card className="bg-[#12121a] border-[#1e1e2e]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                          <Settings2 className="w-4 h-4 text-[#d4a039]" />
                          特征分析
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <FeatureItem
                            label="AI词汇密度"
                            value={detectResult.totalWords > 0
                              ? ((detectResult.features.aiWordCount / detectResult.totalWords) * 100).toFixed(1) + '%'
                              : '0%'}
                            risk={detectResult.features.aiWordCount > 10 ? 'high' : detectResult.features.aiWordCount > 5 ? 'medium' : 'low'}
                          />
                          <FeatureItem
                            label="AI句式数量"
                            value={`${detectResult.features.aiPatternCount}处`}
                            risk={detectResult.features.aiPatternCount > 3 ? 'high' : detectResult.features.aiPatternCount > 1 ? 'medium' : 'low'}
                          />
                          <FeatureItem
                            label="平均句长"
                            value={`${detectResult.features.avgSentenceLength}字`}
                            risk="neutral"
                          />
                          <FeatureItem
                            label="句长方差"
                            value={detectResult.features.sentenceLengthVariance.toFixed(1)}
                            risk={detectResult.features.sentenceLengthVariance < 50 ? 'high' : detectResult.features.sentenceLengthVariance < 150 ? 'medium' : 'low'}
                          />
                          <FeatureItem
                            label="词汇多样性"
                            value={detectResult.features.lexicalDiversity.toFixed(3)}
                            risk={detectResult.features.lexicalDiversity > 0.85 ? 'high' : detectResult.features.lexicalDiversity > 0.7 ? 'medium' : 'low'}
                          />
                          <FeatureItem
                            label="段落均匀度"
                            value={(detectResult.features.paragraphUniformity * 100).toFixed(0) + '%'}
                            risk={detectResult.features.paragraphUniformity > 0.7 ? 'high' : detectResult.features.paragraphUniformity > 0.4 ? 'medium' : 'low'}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* 逐段分析 */}
                    {detectResult.segmentAnalysis.length > 0 && (
                      <Card className="bg-[#12121a] border-[#1e1e2e]">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#d4a039]" />
                            逐段分析
                            <Badge variant="outline" className="text-xs text-[#8a8a9a] border-[#1e1e2e]">
                              {detectResult.segmentAnalysis.length}段
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs text-[#8a8a9a]">
                            红色 = 高AI概率，黄色 = 中等，无色 = 低
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {detectResult.segmentAnalysis.map((seg, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border ${segmentBg(seg.score)}`}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#8a8a9a]">段落 {idx + 1}</span>
                                  <span
                                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                                    style={{
                                      color: scoreColor(seg.score),
                                      backgroundColor: `${scoreColor(seg.score)}15`,
                                    }}
                                  >
                                    AI概率 {seg.score}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-[#e8e6e3] leading-relaxed whitespace-pre-wrap">
                                {seg.text.length > 300 ? seg.text.slice(0, 300) + '...' : seg.text}
                              </p>
                              {seg.reasons.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {seg.reasons.map((reason, rIdx) => (
                                    <span key={rIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0a0f] text-[#8a8a9a] border border-[#1e1e2e]">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>

              {/* 右侧：检测说明 */}
              <div className="lg:col-span-4 space-y-4">
                <Card className="bg-[#12121a] border-[#1e1e2e]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#2dd4a8]" />
                      检测维度
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'AI高频词检测', desc: '扫描文本中AI常用的书面化词汇', icon: '🔤' },
                      { label: '句式模式识别', desc: '识别AI生成的典型句式模板', icon: '📐' },
                      { label: '句子节奏分析', desc: '分析句长变化(Burstiness)', icon: '📊' },
                      { label: '词汇多样性', desc: '计算Type-Token Ratio', icon: '📚' },
                      { label: '过渡词密度', desc: '检测连接词使用频率', icon: '🔗' },
                      { label: '段落均匀度', desc: '分析段落长度的一致性', icon: '📏' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-2.5 p-2 rounded-md bg-[#0a0a0f]/50">
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <div className="text-xs font-medium text-[#e8e6e3]">{item.label}</div>
                          <div className="text-[10px] text-[#8a8a9a]">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-[#12121a] border-[#1e1e2e]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                      评分说明
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2dd4a8]" />
                      <span className="text-xs text-[#8a8a9a]">0-14: 高度可能为人类写作</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#2dd4a8]" />
                      <span className="text-xs text-[#8a8a9a]">15-29: 大概率为人类写作</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#d4a039]" />
                      <span className="text-xs text-[#8a8a9a]">30-49: 可能经过AI辅助</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                      <span className="text-xs text-[#8a8a9a]">50-69: 很可能包含AI内容</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                      <span className="text-xs text-[#8a8a9a]">70-100: 极可能由AI生成</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#12121a] border-[#1e1e2e]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-[#e8e6e3] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#d4a039]" />
                      检测到AI内容？
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[#8a8a9a] mb-3">
                      切换到「改写降AI」模式，一键将AI文本转化为自然的人类表达。
                    </p>
                    <button
                      onClick={() => {
                        if (detectText) {
                          setInputText(detectText);
                          setMode('rewrite');
                        }
                      }}
                      disabled={!detectText}
                      className="w-full py-2 px-3 rounded-lg bg-[#d4a039]/10 border border-[#d4a039]/30 text-[#d4a039] text-xs font-medium hover:bg-[#d4a039]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      将文本送去改写
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2e] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8a8a9a]">DeAICraft - AI痕迹消除工坊 | 让文本回归自然</p>
            <div className="flex items-center gap-4 text-xs text-[#8a8a9a]">
              <span>内置引擎本地处理</span>
              <span>数据不上传</span>
              <span>完全免费</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 特征分析子组件
function FeatureItem({ label, value, risk }: { label: string; value: string; risk: 'high' | 'medium' | 'low' | 'neutral' }) {
  const riskColor = {
    high: 'text-red-400',
    medium: 'text-[#f59e0b]',
    low: 'text-[#2dd4a8]',
    neutral: 'text-[#e8e6e3]',
  };

  const riskBg = {
    high: 'bg-red-500/10',
    medium: 'bg-[#f59e0b]/10',
    low: 'bg-[#2dd4a8]/10',
    neutral: 'bg-[#0a0a0f]/50',
  };

  return (
    <div className={`p-2.5 rounded-lg ${riskBg[risk]} border border-[#1e1e2e]`}>
      <div className="text-[10px] text-[#8a8a9a] mb-1">{label}</div>
      <div className={`text-sm font-bold ${riskColor[risk]}`}>{value}</div>
    </div>
  );
}
