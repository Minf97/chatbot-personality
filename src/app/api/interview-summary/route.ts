import { NextRequest, NextResponse } from 'next/server';
import { KimiMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const apiKey = process.env.KIMI_API_KEY;
    const baseUrl = process.env.KIMI_BASE_URL;
    const model = process.env.KIMI_MODEL;

    if (!apiKey || !baseUrl || !model) {
      return NextResponse.json({ error: 'Kimi API credentials not configured' }, { status: 500 });
    }

    // Create summary prompt
    const summaryMessages: KimiMessage[] = [
      {
        role: 'system',
        content: `你将阅读一份中文访谈记录，该访谈内容由你与一位真实用户之间进行，内容涉及其成长经历、教育背景、职业路径、项目经验、能力倾向、价值观、表达风格等多个方面。你的任务是基于该访谈内容，全面总结这个人的人格、能力、表达特征与事实性经历，形成一份用于构建其“数字人”的高保真画像。

请遵守以下规则：

【总体要求】
1. 所有内容必须严格基于访谈内容总结，不得编造、不补充未被提及的信息。
2. 总结应结构清晰，条理分明，尤其在**事实经历部分要写得完整详尽，时间顺序清楚，细节不遗漏**。
3. 可合理进行内容归类和推理，但所有信息必须有访谈中明确依据。
4. 用语要准确、中立，既可引用原话，也可进行结构化总结。

【输出结构】

1. 全面历史经历与背景（必须完整详尽）
请以**时间顺序**整理受访者从小至今的真实经历，包括但不限于：
- 出生信息与家庭环境：出生地、成长城市、家庭成员、家庭经济状况、父母职业与教养方式
- 教育阶段经历：小学、初中、高中、大学（如有）、研究生（如有）等每个阶段的学校名称、城市、主修方向、是否有转学、休学、考试失败、特别事件或转折
- 重要兴趣与转变：成长中重要兴趣、技能形成经历、是否受到某人或事件影响
- 求职与就业：第一次工作、每一次换工作的背景、岗位内容、离职原因、是否主动还是被动
- 创业经历（如有）：创业起因、合伙人情况、具体做什么、技术栈、融资情况、成败与转折
- 重要事件：如遭遇失败、亲人离世、身份转变、重大意外或改变世界观的时刻
- 所有重要节点的**时间点（年份/阶段）**、**因果关系**与**当时情绪反应**必须尽量标出

2. 当前职业状态与项目聚焦
- 当前工作内容或待业状态、角色定位、所处行业
- 最近主导或参与的重要项目/产品（名称、作用、解决什么问题）
- 职业目标与正在推进的事情

3. 技能与能力倾向
- 擅长哪些具体能力（技术/沟通/设计/组织/市场等）
- 是否表达过技术栈/工具栈/平台偏好
- 学习路径偏好（系统学习、项目驱动、模仿式、碎片化）
- 问题解决倾向（结构拆解、快速试错、外部求助、自我钻研）

4. 思维与表达方式（语言风格分析）
- 结构习惯：是否偏总分/故事式/跳跃型；先说观点还是铺垫
- 用词方式：
  - 是否常用副词修饰，如“非常”、“其实”、“有点”
  - 名词化 vs 动态动词表达，例如“决策制定” vs “做决定”
  - 是否喜用抽象词（自由、意义）或具体行为
  - 逻辑连接词的频率（因为、所以、但是、不过）
- 句法与节奏：
  - 偏好长句还是短句
  - 是否有犹豫词、缓冲语（“我想一下”、“其实…”）
- 情绪风格：语气坚定、克制、犹豫、随性、俏皮等
- 个性化语言标记：是否有口头禅、高频用语、独特句式

5. 情绪表达与行为风格
- 情绪处理方式：面对压力时沉默/表达/发泄/逃避？
- 行动与反思偏好：做了再想 vs 想透再做
- 是否偏外向/独立/协作/冒险/保守/共情等人格维度

6. 价值观与信念体系
- 生活或职业中最重视的价值：自由、秩序、责任、挑战、亲密关系等
- 对失败/成功的定义
- 面对冲突与选择时倾向的判断方式
- 是否表现出任何社会、文化、政治倾向（仅限明确表达部分）

7. 社交与人际互动
- 社交喜好：是否享受社交、偏好小圈深聊或大范围交流
- 合作方式偏好：主导型/协调型/补位型/单打独斗型
- 建立信任的机制：观察/直接问/共同经历等

8. 数字人模拟表达提示（供后续生成模拟用）
- 模拟语气：整体语气风格（自信、平和、随性、克制）
- 模拟表达方式：
  - 是否用铺垫句、比喻、长段说明？
  - 常用开场句式（如“我觉得这事本质上…”、“说白了就是…”）
  - 情绪表达是否用“我很在意…”、“我挺气愤…”等直白句
- 建议保留的口头表达、关键词语、语调风格（如“其实”、“反正”、“我一般会…”）

请严格按上述格式输出完整内容，特别是第1节“全面历史经历”必须尽量详细，时间顺序清晰，不遗漏访谈中出现过的任何关键事件、阶段或转折点。
`
      },
      {
        role: 'user',
        content: `请根据以下采访对话内容进行总结：\n\n${messages.map((msg: { role: string; content: string }) => `${msg.role === 'user' ? '记者' : 'AI'}：${msg.content}`).join('\n\n')}`
      }
    ];

    const requestBody = {
      model: model,
      messages: summaryMessages,
      temperature: 0.3, // Lower temperature for more focused summary
      max_tokens: 1500,
      stream: false
    };

    console.log('Generating interview summary...');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Summary API Error:', errorData);
      throw new Error(`Summary API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No summary generated');
    }

    const summary = data.choices[0].message.content;

    // Generate tags from the summary
    const tagsMessages: KimiMessage[] = [
      {
        role: 'system',
        content: `请基于以下访谈总结内容，生成不超过10个简洁的标签，用来描述这个人的特征。

要求：
1. 标签应该简洁明了，每个标签1-3个字
2. 包含但不限于：性格特征、能力特长、职业方向、兴趣爱好、价值观倾向等
3. 必须严格基于总结内容，不能编造
4. 只返回标签列表，用中文逗号分隔
5. 数量控制在10个以内

示例格式：技术专家,创业者,理性思考,注重细节,团队协作`
      },
      {
        role: 'user',
        content: `请基于以下访谈总结生成标签：\n\n${summary}`
      }
    ];

    const tagsRequestBody = {
      model: model,
      messages: tagsMessages,
      temperature: 0.2, // Lower temperature for consistent tagging
      max_tokens: 200,
      stream: false
    };

    console.log('Generating tags from summary...');

    const tagsResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(tagsRequestBody)
    });

    let tags: string[] = [];
    
    if (tagsResponse.ok) {
      const tagsData = await tagsResponse.json();
      if (tagsData.choices && tagsData.choices.length > 0) {
        const tagsString = tagsData.choices[0].message.content;
        // Parse the comma-separated tags and clean them
        tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
        // Limit to 10 tags maximum
        tags = tags.slice(0, 10);
      }
    } else {
      console.warn('Failed to generate tags, continuing without tags');
    }

    return NextResponse.json({
      summary: summary,
      tags: tags,
      timestamp: new Date().toISOString(),
      messageCount: messages.length
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}