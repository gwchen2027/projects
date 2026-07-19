import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DeAICraft - AI痕迹消除工坊',
    template: '%s | DeAICraft',
  },
  description:
    '专业的AI文本改写工具，聚合全球免费降AI率API。内置6种改写策略，支持中英文，本地处理保护隐私。',
  keywords: [
    '降AI率',
    '去AI痕迹',
    'AI文本改写',
    'AI检测绕过',
    '文本人性化',
    'paraphraser',
    'AI humanizer',
    'free API',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased bg-[#0a0a0f] text-[#e8e6e3]">
        {children}
      </body>
    </html>
  );
}
