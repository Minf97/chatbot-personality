# AI电话助手

基于Minimax TTS和Kimi大模型的智能语音对话系统，支持实时语音交互和自然语言对话。

## 功能特性

- 🎤 **实时语音识别** - 使用Web Speech API进行语音转文本
- 🔊 **高质量语音合成** - 集成Minimax TTS服务
- 🤖 **智能对话** - 基于Kimi大模型的自然语言理解
- 📱 **现代化界面** - 响应式设计，支持移动端
- ⚡ **低延迟体验** - 优化的语音处理流程
- 🛡️ **完善的错误处理** - 用户友好的错误提示

## 技术栈

- **前端框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **语音合成**: Minimax TTS API
- **语言模型**: Kimi (Moonshot AI)
- **语音识别**: Web Speech API
- **图标**: Lucide React
- **类型检查**: TypeScript

## 快速开始

### 环境要求

- Node.js 18+
- 现代浏览器（支持Web Speech API）
- 麦克风权限

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd phone-ai
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env.local` 文件并添加以下配置：

```env
# Minimax API Configuration
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_minimax_group_id

# Kimi API Configuration
KIMI_API_KEY=your_kimi_api_key
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2-0711-preview
```

4. 启动开发服务器
```bash
npm run dev
```

5. 打开浏览器访问 `http://localhost:3000`

## 使用说明

1. **开始通话**: 点击绿色电话按钮开始与AI对话
2. **授权麦克风**: 首次使用需要授权浏览器使用麦克风
3. **语音对话**: 开始通话后，直接说话即可与AI进行对话
4. **结束通话**: 点击红色按钮结束通话

## API配置

### Minimax TTS

1. 访问 [Minimax开放平台](https://api.minimax.chat/)
2. 注册账户并获取API Key和Group ID
3. 将配置信息添加到环境变量中

### Kimi (Moonshot AI)

1. 访问 [Moonshot AI平台](https://platform.moonshot.cn/)
2. 注册账户并获取API Key
3. 将API Key添加到环境变量中

## 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API路由
│   │   ├── chat/       # Kimi聊天API
│   │   └── tts/        # Minimax TTS API
│   └── page.tsx        # 主页面
├── components/         # React组件
│   ├── ChatMessages.tsx
│   ├── ErrorBanner.tsx
│   └── PhoneControlButton.tsx
├── hooks/              # 自定义Hooks
│   ├── useAudioRecording.ts
│   └── useSpeechRecognition.ts
├── lib/                # 核心库文件
│   ├── audio-recording.ts
│   ├── chat.ts
│   ├── conversation-manager.ts
│   ├── error-handler.ts
│   ├── performance-monitor.ts
│   ├── speech-recognition.ts
│   ├── store.ts
│   └── tts.ts
└── types/              # TypeScript类型定义
    └── index.ts
```

## 浏览器兼容性

- Chrome 25+ (推荐)
- Firefox 44+
- Safari 14.1+
- Edge 79+

> 注意：语音识别功能依赖于Web Speech API，不同浏览器的支持程度可能有所差异。

## 性能优化

- 使用性能监控器跟踪关键操作的耗时
- 实现音频流式处理减少延迟
- 优化状态管理避免不必要的重渲染
- 支持音频播放中断机制

## 错误处理

系统提供完善的错误处理机制：

- 用户友好的错误提示
- 自动错误恢复
- 详细的开发调试信息
- 性能指标监控

## 部署

### Vercel部署（推荐）

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署完成

### 自托管部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 开发指南

### 添加新的语音功能

1. 在 `lib/` 目录下创建新的服务文件
2. 使用性能监控和错误处理包装关键操作
3. 在 `conversation-manager.ts` 中集成新功能
4. 更新UI组件以支持新功能

### 自定义错误处理

```typescript
import { errorHandler } from '@/lib/error-handler';

try {
  // 你的代码
} catch (error) {
  const userFriendlyMessage = errorHandler.getUserFriendlyMessage(error);
  // 处理错误
}
```

### 性能监控

```typescript
import { performanceMonitor } from '@/lib/performance-monitor';

const result = await performanceMonitor.measureAsync(
  'operation-name',
  async () => {
    // 需要监控的操作
  }
);
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如果您有任何问题或建议，请通过以下方式联系：

- 创建Issue
- 发送邮件
- 提交Pull Request

---

Made with ❤️ by AI Assistant
