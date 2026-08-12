// ============================================================
// AI 审稿引擎 v2 · 两步式（Brief 合规 + 内容爆款潜力）
// ============================================================
window.CC_REVIEW = (function () {
  function B() { return (typeof window.getActiveBrief === 'function' ? window.getActiveBrief() : window.CC_DATA.brief); }

  // 功能关键词（Sig / AI 识别）
  const AI_KW = ['ai', 'sig', '智能', '训练反馈', '训练计划', '专业分析', '北体', '个性化建议', 'sig 反馈'];

  // 场景化词汇（对应产品可视化卖点）
  const SCENE_KW = ['香蕉', '米饭', '奶茶', '企鹅', '猎豹', '地图日记', '城市', '街道', '轨迹', '电子护照', '奖牌', '心情日记', 'emoji'];

  // 情绪金句关键词
  const EMOTION_KW = ['花期', '不用赶', '和解', '虚无', '空虚', '拥抱', '底气', '治愈', '力量', '成长', '独处', '不尊重', '自我', '掌控', '野心', '沉淀'];

  // 干货工具关键词
  const TOOL_KW = ['方法', '步骤', '攻略', '技巧', '拆解', '分享', '教程', '干货', '整理', '总结', '公式', '模板', '思路'];

  // 数字型标题
  const NUM_RE = /(\d+)\s*(k|km|公里|斤|kg|个|天|小时|分钟|周|月|年|次|w|万)/i;

  // 品牌梗
  const BRAND_MEME = /(西格玛|sigma[男女人]?)/i;

  function has(text, kws) {
    const t = (text || '').toLowerCase();
    return kws.some(k => t.includes(k.toLowerCase()));
  }

  // ==================== STEP 1 · Brief 合规质检 ====================
  function checkCompliance(input) {
    const text = (input.title || '') + '\n' + (input.copy || '');
    const t = text.toLowerCase();

    const items = [];

    // 双话题
    const hasSigma = /#\s*sigma(?!跑步)/i.test(text) || /#sigma\b/i.test(text);
    const hasSigmaRun = /#\s*sigma\s*跑步/i.test(text);
    items.push({
      key: 'tag_sigma', label: '#Sigma 话题', pass: hasSigma,
      hint: hasSigma ? '已带 #Sigma' : '正文/标题里没找到 #Sigma，请在文末加上',
      fix: hasSigma ? null : '在正文末尾追加：#Sigma',
    });
    items.push({
      key: 'tag_sigma_run', label: '#Sigma跑步 话题', pass: hasSigmaRun,
      hint: hasSigmaRun ? '已带 #Sigma跑步' : '缺 #Sigma跑步 话题',
      fix: hasSigmaRun ? null : '在正文末尾追加：#Sigma跑步',
    });

    // @官方账号
    const hasMention = /@\s*sigma/i.test(text);
    items.push({
      key: 'mention', label: '@Sigma 官方账号', pass: hasMention,
      hint: hasMention ? '已 @Sigma 官方账号' : '正文里没有 @Sigma',
      fix: hasMention ? null : '在正文合适位置（推荐末尾）加：@Sigma',
    });

    // AI Sig 提及（强制）
    const hasAI = has(text, AI_KW);
    items.push({
      key: 'ai', label: 'AI 伙伴 Sig 提及（Brief 强制）', pass: hasAI,
      hint: hasAI ? '已展示 AI Sig 功能' : '未提到 AI Sig，Brief 明确要求必须展示',
      fix: hasAI ? null : '示例句可以插入正文：「跑完 Sig 直接把训练反馈甩给我，结合北体大知识库告诉我下一次可以更快 10 秒」',
    });

    // 字数
    const chars = (input.copy || '').replace(/\s/g, '').length;
    items.push({
      key: 'chars', label: `文案字数 ≥ 20 字（当前 ${chars} 字）`, pass: chars >= 20,
      hint: chars >= 20 ? `文案共 ${chars} 字，达标` : `文案仅 ${chars} 字，Brief 要求 ≥ 20 字`,
      fix: chars >= 20 ? null : '至少再补 ' + (20 - chars) + ' 字，介绍你实际跑步中/后使用 Sigma 的体验',
    });

    const passCount = items.filter(i => i.pass).length;
    const allPass = passCount === items.length;

    return {
      pass: allPass,
      verdict: allPass ? '合规' : '不合规',
      passCount, total: items.length,
      items,
    };
  }

  // ==================== STEP 2 · 内容爆款潜力评估 ====================
  function checkQuality(input) {
    const title = input.title || '';
    const copy = input.copy || '';
    const text = title + '\n' + copy;

    // ---- 要素 1：标题钩子 ----
    const hookTypes = [];
    if (BRAND_MEME.test(title)) hookTypes.push({ name: '品牌梗', example: '案 1「做西格玛男人 跑起来」' });
    if (/[?？]|如何|怎么|无痛|why|怎样/i.test(title)) hookTypes.push({ name: '痛点方案', example: '案 2「如何无痛放下手机 提高执行力」' });
    if (NUM_RE.test(title)) hookTypes.push({ name: '数字堆叠', example: '案 4「6am晨跑22K｜一天48小时」' });
    if (/[｜\|]|vlog|挑战/i.test(title)) hookTypes.push({ name: '垂类模板', example: '案 5「健身vlog｜臀腿日+校园跑」' });
    if (title.length >= 12 && /[，。！？…、"]/.test(title) === false && has(title, EMOTION_KW)) hookTypes.push({ name: '金句情绪', example: '案 3「所有不尊重你的人 赌的都是你没前途」' });

    const hook = {
      score: hookTypes.length >= 1 ? (hookTypes.length >= 2 ? 'A' : 'B') : 'C',
      types: hookTypes,
      diagnosis: hookTypes.length
        ? `已命中 ${hookTypes.map(h => h.name).join(' + ')} 公式`
        : '标题较平铺，未命中爆款 5 大公式（品牌梗/痛点/金句/数字/垂类模板）',
      rewrite: hookTypes.length ? null : rewriteTitle(title, input),
    };

    // ---- 要素 2：植入位置 / 深度 ----
    const pos = detectEmbedLevel(copy);
    const embed = {
      level: pos.level,
      diagnosis: pos.desc,
      rewrite: pos.suggestion,
      score: pos.level === 'L1' ? 'C' : (pos.level === 'L5' ? 'A' : 'B'),
    };

    // ---- 要素 3：功能场景化 ----
    const hitScenes = SCENE_KW.filter(k => text.toLowerCase().includes(k.toLowerCase()));
    const scene = {
      score: hitScenes.length >= 2 ? 'A' : (hitScenes.length === 1 ? 'B' : 'C'),
      hits: hitScenes,
      diagnosis: hitScenes.length
        ? `用了「${hitScenes.join('、')}」等场景化词，画面感 ${hitScenes.length >= 2 ? '强' : '一般'}`
        : '功能描述偏抽象，缺少像"香蕉/米饭/企鹅步/电子护照/地图日记"这类高画面感词',
      rewrite: hitScenes.length >= 2 ? null : sceneRewrite(copy),
    };

    // ---- 要素 4：情绪 or 干货感 ----
    const hasEmotion = has(text, EMOTION_KW);
    const hasTool = has(text, TOOL_KW);
    const hasNum = NUM_RE.test(text);
    let vibeTag, vibeHint;
    if (hasEmotion && hasNum) { vibeTag = 'A'; vibeHint = '情绪金句 + 具体数字，最适合冲高赞爆款（参考案 3、4）'; }
    else if (hasEmotion) { vibeTag = 'A'; vibeHint = '偏情绪金句路线，容易冲高赞（参考案 3、11、13）'; }
    else if (hasTool) { vibeTag = 'A'; vibeHint = '偏工具/方法论路线，藏赞比会更高（参考案 2、12、15）'; }
    else if (hasNum) { vibeTag = 'B'; vibeHint = '带数字信息量还行，可以再加一句金句或方法论强化'; }
    else { vibeTag = 'C'; vibeHint = '既缺情绪金句也缺方法论感，容易变成"平淡日常记录"'; }

    const vibe = {
      score: vibeTag,
      diagnosis: vibeHint,
      rewrite: vibeTag === 'C' ? '在开头/结尾加一句：\n· 情绪型："你有自己的花期，不用赶春天"（案 11 风格）\n· 工具型："普通人对抗虚无的顶级解法，就是找到一个输出型爱好"（案 12 风格）' : null,
    };

    // ---- 综合爆款率 ----
    const scores = [hook.score, embed.score, scene.score, vibe.score];
    const aCount = scores.filter(s => s === 'A').length;
    const cCount = scores.filter(s => s === 'C').length;
    let potential, potentialColor, potentialDesc;
    if (aCount >= 3 && cCount === 0) {
      potential = '🔥 高爆款潜力';
      potentialColor = 'hot';
      potentialDesc = '按当前思路精修即可发布，预期赞量 ≥ 2000';
    } else if (cCount === 0 || (aCount >= 2 && cCount <= 1)) {
      potential = '👍 稳定合作款';
      potentialColor = 'good';
      potentialDesc = '合规达标 + 内容中上，预期赞量 500-1500';
    } else {
      potential = '📈 需调整再发';
      potentialColor = 'warn';
      potentialDesc = '至少 2 个要素偏弱，建议对照下方改写建议再走一版';
    }

    return {
      hook, embed, scene, vibe,
      potential, potentialColor, potentialDesc,
      aCount, cCount,
    };
  }

  // ---- 辅助：植入等级识别 ----
  function detectEmbedLevel(copy) {
    const c = copy || '';
    const chars = c.replace(/\s/g, '').length;
    const sigmaHits = (c.match(/sigma/gi) || []).length;
    const funcHits = SCENE_KW.filter(k => c.toLowerCase().includes(k.toLowerCase())).length +
                     AI_KW.filter(k => c.toLowerCase().includes(k.toLowerCase())).length;

    // 只出现 @Sigma / 只有一次品牌名 → L1
    if (sigmaHits <= 1 && funcHits === 0) {
      return {
        level: 'L1',
        desc: '当前是「末位挂角」型——只出现一次品牌名，几乎不讲功能',
        suggestion: '如果目标是爆款情绪向可以保留；如果是种草可以升到 L3：加一句功能场景，例如「跑完 Sig 立刻给我复盘配速」',
      };
    }
    if (sigmaHits >= 1 && funcHits === 1) {
      return { level: 'L2', desc: '「一句话种草」型——点了名字 + 1 个卖点', suggestion: '可以再加一个场景词（香蕉/地图日记）升到 L3' };
    }
    if (funcHits >= 2 && funcHits <= 3) {
      return { level: 'L3', desc: '「中置融合」型——把功能自然嵌入方法论/训练场景', suggestion: null };
    }
    if (funcHits >= 4 && /(校园跑量赛|活动|抽奖|福利|奖励)/i.test(c)) {
      return { level: 'L5', desc: '「深度评测 + 活动钩子」——多功能全展开 + 转化钩子，最完整', suggestion: null };
    }
    if (funcHits >= 4) {
      return { level: 'L4', desc: '「前置口播」型——开头大段讲功能', suggestion: '如果想再升到 L5，末尾加一个校园跑量赛/福利活动钩子（参考案 9）' };
    }
    return { level: 'L3', desc: '「中置融合」型', suggestion: null };
  }

  // ---- 辅助：标题改写建议 ----
  function rewriteTitle(title, input) {
    const suggestions = [];
    // 数字型
    suggestions.push({ type: '数字堆叠', text: `6am晨跑${input.copy && /(\d+)k/i.test(input.copy) ? input.copy.match(/(\d+)k/i)[0] : '5K'}｜跑步这件小事我坚持了 30 天` });
    // 品牌梗
    suggestions.push({ type: '品牌梗', text: '做西格玛跑者的第 30 天 我居然爱上了跑步' });
    // 痛点
    suggestions.push({ type: '痛点方案', text: '如何让自己不情不愿的也能坚持跑步（附实测）' });
    // 金句
    suggestions.push({ type: '金句情绪', text: '你有自己的花期 不用赶春天' });
    return suggestions;
  }

  // ---- 辅助：场景化改写 ----
  function sceneRewrite(copy) {
    return `在功能描述里替换成场景化说法，例如：
· "记录卡路里" → "今天跑完消耗了 1 根香蕉的热量，成就感直接拉满"
· "配速数据" → "从企鹅步慢慢跑到猎豹步"
· "轨迹功能" → "跑过的每一条街都被 Sigma 点亮成城市地图日记"
· "月度总结" → "月报刚出，跑过的米饭够我多吃好几碗"`;
  }

  // ==================== 主入口 ====================
  function review(input) {
    const step1 = checkCompliance(input);
    const step2 = checkQuality(input);
    return { step1, step2 };
  }

  return { review };
})();
