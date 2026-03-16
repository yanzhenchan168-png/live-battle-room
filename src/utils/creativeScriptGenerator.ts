/**
 * 创意话术生成器 - 多样化、个性化的直播话术生成
 */

// ============= 基础类型定义 =============
export interface ScriptInput {
  productName: string;
  price: number;
  sellingPoint: string;
  targetAudience: string;
  trafficLevel?: number;
  formulaId?: number;
  productCategory?: string;
}

export interface GeneratedScript {
  full_script: string;
  structure: {
    shaping: string;
    pricing: string;
    harvesting: string;
  };
  style: string;
}

// ============= 随机工具函数 =============
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ============= 产品类别识别 =============
const detectCategory = (productName: string, sellingPoint: string): string => {
  const text = (productName + sellingPoint).toLowerCase();
  if (/裙|衣|裤|装|外套|大衣|毛衣|衬衫|T恤|内搭/.test(text)) return 'clothing';
  if (/护肤|面膜|精华|面霜|口红|彩妆|化妆|口红|唇膏/.test(text)) return 'beauty';
  if (/食|吃|喝|茶|咖啡|零食|糕点|滋补|营养/.test(text)) return 'food';
  if (/手机|耳机|电器|智能|数码|电子/.test(text)) return 'electronics';
  if (/包|鞋|配饰|首饰|项链|戒指|手表/.test(text)) return 'accessories';
  if (/家|床|枕|被|杯|壶|收纳|清洁/.test(text)) return 'household';
  if (/玩|乐|娱|游戏|健身|运动/.test(text)) return 'entertainment';
  return 'general';
};

// ============= 开场白库 =============
const OPENING_STYLES = {
  story: [
    '姐妹们，前两天有个粉丝私信我，说买了${productName}之后...',
    '我给大家讲个真事儿，上个月我朋友...',
    '说起来这个${productName}，背后其实有个小故事...',
    '直播间的姐妹们，你们猜我昨天收到了什么？',
    '我必须跟大家分享一下，这个让我惊喜到睡不着的东西...',
  ],
  
  question: [
    '姐妹们，有没有遇到过这种尴尬？',
    '直播间有多少姐妹，每天都在为${painPoint}发愁？扣个1让我看看',
    '我问大家一个问题：你们觉得好用的${productName}，应该是什么样子？',
    '有多少人买过${productName}，结果踩坑的？举手让我看看',
    '如果告诉你，用不到${comparePrice}就能解决这个问题，你信不信？',
  ],
  
  scenario: [
    '想象一下这个场景：早上出门，你${painPoint}...',
    '姐妹们有没有这种经历：精心打扮出门，结果因为${painPoint}...',
    '每次${scenario}的时候，你是不是都在想，要是能解决这个问题就好了？',
    '春天来了，夏天还会远吗？你们准备好迎接${seasonEvent}了吗？',
    '忙碌了一天回到家，你最想做的是什么？',
  ],
  
  data: [
    '姐妹们，这款${productName}上线才${days}天，已经卖出${sales}单了',
    '告诉大家一个数据：超过${percent}%的姐妹回购这款${productName}',
    '我先甩一个数字：${reviews}条好评，平均分${rating}分',
    '你们知道吗？这款${productName}在同类产品里，复购率排名第一',
    '双十一我们卖了${sales}件，今天我给直播间争取到了更好的价格',
  ],
  
  direct: [
    '姐妹们，今天要给大家推荐的是我自用的${productName}',
    '直奔主题：这款${productName}，是我今年挖到的宝藏',
    '不绕弯子，这个${productName}真的好用，我全家都在用',
    '直播间都知道我很少推产品，但这个${productName}我必须分享',
    '今天这个${productName}，是我测评了${count}款后选出来的',
  ],
  
  emotion: [
    '姐妹们，我真的迫不及待要分享这个了！',
    '天哪，我终于找到了解决${painPoint}的终极方案！',
    '说实话，第一次用这个${productName}的时候，我真的惊了',
    '你们知道我找了多久，才找到这款${productName}吗？',
    '我不允许还有姐妹不知道这个宝藏${productName}！',
  ],
};

// ============= 塑品段模板库 =============
const SHAPING_TEMPLATES = {
  // 痛点深挖型
  painPoint: (input: ScriptInput) => {
    const painPoints = input.sellingPoint.split(/[，,、]/);
    const templates = [
      `【先聊聊痛点】

姐妹们，咱们先说说这个扎心的问题：${painPoints[0]}

你们是不是也有这种经历？
• 明明很用心，但就是${painPoints[0]}
• 试了各种方法，钱花了不少，效果却...

我跟你们说，这个事情我太有发言权了。
因为我以前也是这样！

直到我遇到了这款${input.productName}——

${painPoints.length > 1 ? `它不光解决了"${painPoints[0]}"的问题，还顺带解决了"${painPoints[1]}"！` : `它完美解决了"${painPoints[0]}"的问题！`}

怎么做到的？我来给大家拆解一下...`,

      `【这个痛点，90%的人都在忍受】

${input.targetAudience}的姐妹，举起手让我看看！

你们是不是每天都要面对这个问题：${painPoints[0]}？

我之前一个粉丝跟我说，她为了解决这个问题，前前后后花了两三万。

结果呢？钱没了，问题还在。

直到她用了这款${input.productName}。

用了一个月，她给我发私信说：早知道有这个，我那两三万就不用花了！

所以姐妹们，今天这个直播，你们真的要听进去。
这不是卖货，这是帮你们省钱！`,

      `【为什么你之前的都没用？】

很多姐妹问我：为什么我买了那么多${input.productName}，效果都不好？

问题出在哪？

因为你买到的，都是"治标不治本"的产品。

真正能解决问题的${input.productName}，需要满足三个条件：
1. ${painPoints[0] ? `能从根本上解决${painPoints[0]}` : '针对性强'}
2. ${painPoints[1] ? `同时改善${painPoints[1]}` : '温和不刺激'}
3. ${painPoints[2] || '效果持久'}

我手里这款，三个条件全占了。

不是我吹，咱们用事实说话。`,
    ];
    return randomPick(templates);
  },

  // 场景代入型
  scenario: (input: ScriptInput) => {
    const scenarios = [
      `【场景一：早上的困扰】

姐妹们，你们早上出门前是什么状态？
是不是经常因为${input.sellingPoint.split(/[，,、]/)[0]}，折腾大半天？

我以前就是这样，每天早上跟打仗一样。

但现在？有了这款${input.productName}，我多睡半小时都没问题！

【场景二：重要的场合】

你们有没有这种经历：
要去重要的场合，结果因为${input.sellingPoint.split(/[，,、]/)[0]}，整个人都不自信了？

我粉丝跟我说，她面试的时候因为这个，全程都没敢直视面试官。

用了这款${input.productName}之后，她告诉我：现在去哪都不怯场了。

【场景三：约会/聚会】

姐妹们，约会的时候最怕什么？
当然是${input.sellingPoint.split(/[，,、]/)[0]}啊！

这款${input.productName}，就是我给你们准备的"秘密武器"。`,

      `【这是我真实的使用场景】

给大家说说我是怎么发现这款${input.productName}的。

有一次我要去${input.targetAudience.includes('职场') ? '见客户' : '参加活动'}，
结果出门前发现${input.sellingPoint.split(/[，,、]/)[0]}。

当时我急得不行，朋友随手递给我这个说："试试这个。"

我半信半疑用了，结果——效果立竿见影！

从那以后，它就成了我包里的必备品。

【为什么它能这么好用？】

不是什么黑科技，就是实打实的品质：
${input.sellingPoint.split(/[，,、]/).map((p, i) => `${i + 1}. ${p.trim()}`).join('\n')}`,

      `【先别急着划走，听我说完这个场景】

想象一下：你精心打扮去${input.targetAudience.includes('职场') ? '公司' : '聚会'}，
一切都很完美，唯独${input.sellingPoint.split(/[，,、]/)[0]}。

那种感觉，是不是特别影响心情？

我之前一个姐妹，因为这个问题，都不太愿意出门社交了。

直到我给她推荐了这款${input.productName}。

现在？她比谁都自信！

为什么会这样？

因为这款产品真正解决了核心问题：
它不只是表面功夫，而是从根源改善。`,
    ];
    return randomPick(scenarios);
  },

  // 对比法
  comparison: (input: ScriptInput) => {
    const comparePrice = Math.round(input.price * 2.5);
    const templates = [
      `【市面上的${input.productName}，我帮你们测了一圈】

姐妹们，说句大实话：
现在市面上的${input.productName}，质量参差不齐。

我帮你们总结了一下，主要有三类：

❌ 第一类：便宜货
价格是便宜，但用了之后？
要么没效果，要么还有副作用。

❌ 第二类：大牌溢价
动不动就${comparePrice}往上，
效果是不错，但普通人谁天天消费得起？

✅ 第三类：就是我今天要推荐的这款
品质对标大牌，价格却是它的三分之一不到。

为什么能做到？因为我直接跟厂家谈的！`,

      `【为什么选这款${input.productName}？】

我给大家算一笔账：

市面上同品质的${input.productName}：
• 大牌：${comparePrice}～${comparePrice + 200}
• 中档：${Math.round(comparePrice * 0.7)}左右
• 我们这款：${input.price}

但价格低≠品质差！

恰恰相反，我用过这么多款，这款是性价比最高的。

为什么？
1. 不做广告，省下的钱用在产品上
2. 直播间直销，没有中间商赚差价
3. 品质对标大牌，价格亲民接地气`,

      `【同样是${input.productName}，差别怎么这么大？】

我给大家看两组数据：

普通${input.productName}：
• ${input.sellingPoint.split(/[，,、]/)[0]}？基本没有
• 成分？都是便宜货
• 效果？用了跟没用差不多

我们这款${input.productName}：
• ${input.sellingPoint.split(/[，,、]/)[0]}？核心卖点！
• 成分？都是实打实的好东西
• 效果？用过的姐妹都说好

同样的品类，为什么差别这么大？

因为做产品的人，用心程度不一样。

我选品的标准就一个：我自己会用，我才会推荐给你们。`,
    ];
    return randomPick(templates);
  },

  // 信任背书型
  trust: (input: ScriptInput) => {
    const sales = randomInt(10000, 50000);
    const rating = (4.8 + Math.random() * 0.15).toFixed(1);
    const templates = [
      `【先说说这款${input.productName}的成绩单】

上架以来，已经卖了${sales.toLocaleString()}单
好评率：${rating}分（满分5分）
复购率：超过${randomInt(35, 50)}%

这些数字意味着什么？

意味着每10个人里，有9个会回头再来买。
意味着这款产品，是真的好用，不是营销出来的。

我从来不强迫任何人买东西，
因为好的产品，自己会说话。`,

      `【为什么这么多人在用？】

这款${input.productName}：
• ${randomInt(100, 300)}万+姐妹的选择
• 连续${randomInt(3, 12)}个月品类销量前三
• 小红书${randomInt(5, 20)}万+篇真实笔记

不是我吹，是市场替我说话。

我粉丝群里用过的姐妹，都在帮着安利：
"用过最好的${input.productName}，没有之一"

这种口碑，是营销不来的，
是产品真的好用，大家才会自发推荐。`,

      `【这些真实的反馈，比我说一万句都有用】

我给大家念几条粉丝的评价：

📱 "入手之前半信半疑，用了之后真香了！"

📱 "${input.sellingPoint.split(/[，,、]/)[0]}，真的有效！已经回购第三次了"

📱 "本来是冲着价格来的，结果被品质圈粉了"

📱 "推荐给闺蜜，闺蜜又推荐给她同事，现在我们整个办公室都在用"

姐妹们，群众的眼睛是雪亮的。
好不好用，用过的姐妹最有发言权。`,
    ];
    return randomPick(templates);
  },

  // 专业解析型
  professional: (input: ScriptInput) => {
    const templates = [
      `【从专业角度，给大家讲讲这款${input.productName}】

我不是卖货的，我是做内容的。
所以我选品的标准，只有一个：产品本身够不够好。

这款${input.productName}，我研究了很久才敢推荐。

它的核心技术在于：
${input.sellingPoint.split(/[，,、]/).map((p, i) => `👉 ${p.trim()}`).join('\n')}

这几点看起来简单，但市面上能做到的，真的不多。

我不是要踩谁，但事实就是：
很多品牌把钱花在广告上，而不是产品上。

而这款产品，恰恰相反。

这就是为什么它性价比这么高的原因。`,

      `【为什么我说这款${input.productName}值得买？】

作为一个测评过${randomInt(50, 200)}款同类产品的人，
我选品有自己的一套标准：

✅ 成分/材质必须过关
✅ 效果必须经得起验证
✅ 价格必须合理
✅ 售后必须有保障

这款${input.productName}，四项全达标。

特别是${input.sellingPoint.split(/[，,、]/)[0]}这一点，
我对比过不下十款产品，它的表现是最稳定的。

说人话就是：它真的管用。`,

      `【不多说，直接上干货】

这款${input.productName}的核心卖点：

📌 ${input.sellingPoint.split(/[，,、]/)[0] || '核心功能强大'}
${input.sellingPoint.split(/[，,、]/)[1] ? `📌 ${input.sellingPoint.split(/[，,、]/)[1]}` : ''}
${input.sellingPoint.split(/[，,、]/)[2] ? `📌 ${input.sellingPoint.split(/[，,、]/)[2]}` : ''}

我为什么不罗列一堆参数？

因为参数再好看，不好用也没意义。

我只告诉大家一件事：它能解决你的问题。

至于怎么解决的，来，我给大家演示一下...`,
    ];
    return randomPick(templates);
  },
};

// ============= 报价段模板库 =============
const PRICING_TEMPLATES = {
  value: (input: ScriptInput) => {
    const marketPrice = Math.round(input.price * 2.5);
    const discount = Math.round((1 - input.price / marketPrice) * 100);
    return `【关于价格，我给大家交个底】

姐妹们，这款${input.productName}：

💰 市场零售价：¥${marketPrice}
💰 专柜价格：¥${marketPrice + 100}～${marketPrice + 300}
💰 今天直播间：¥${input.price}

省了多少钱？差不多${discount}%！

我不是来割韭菜的，我是来给粉丝谋福利的。

这个价格，我敢说是全网最低，
买贵了直接来找我，差价双倍返还！` ;
  },

  breakdown: (input: ScriptInput) => {
    const cost = Math.round(input.price * 0.4);
    return `【¥${input.price}，这个价格怎么来的？】

我给大家拆解一下：

📦 产品成本：约¥${cost}
🚚 运费：我们包
📦 包装：精装礼盒
🛡️ 售后：7天无理由退换

如果是大牌，同样配置至少卖¥${input.price * 2}

但我们为什么能做到这个价？

因为我们走的是量，不是溢价。
我跟厂家说的是：我把量给你做起来，你给我最低价。

所以这个¥${input.price}，是真的实在价。`;
  },

  compare: (input: ScriptInput) => {
    const comparePrice = Math.round(input.price * 2);
    return `【算笔账，你就知道有多划算了】

假设你去线下买同等品质的${input.productName}：
至少要花¥${comparePrice}往上。

今天直播间¥${input.price}，
省下来的钱，够你${input.price < 100 ? '再买一件了' : '买好几杯奶茶了'}！

而且我给你们准备了更多福利：
🎁 买一送一配件
🎁 顺丰包邮
🎁 赠运费险

算下来，这个性价比，
你上哪找去？`;
  },

  psychological: (input: ScriptInput) => {
    return `【说实话，定价的时候我纠结了很久】

厂家建议我卖¥${input.price + 50}，
但我坚持要¥${input.price}。

为什么？

因为我想让更多姐妹用得起好产品。

¥${input.price}是什么概念？
• 不到一顿火锅的钱
• 不到一件普通衣服的钱
• 却能解决你${input.sellingPoint.split(/[，,、]/)[0]}的问题

这个账，姐妹们自己算。`;
  },

  guarantee: (input: ScriptInput) => {
    return `【¥${input.price}，给大家的承诺】

很多姐妹担心：这么便宜，质量会不会有问题？

我给大家三个承诺：

✅ 承诺一：正品保障，假一赔十
✅ 承诺二：7天无理由退换，不满意随时退
✅ 承诺三：运费险我出，退货不花一分钱

¥${input.price}买个放心，试试又何妨？

反正不满意随时退，你没有任何风险。

但是万一好用呢？
那就是赚到了！`;
  },
};

// ============= 收割段模板库 =============
const HARVESTING_TEMPLATES = {
  urgency: (input: ScriptInput) => {
    const stock = randomInt(30, 80);
    return `【⚠️ 重要提醒】

这个价格，仅限今天直播间！
库存我看了，只剩${stock}单！

为什么这么少？

因为这个价格本来就是亏本冲量的。
厂家给我批了100单，前面已经卖了一部分。

现在只剩${stock}单，抢完就没有了！

不是我制造焦虑，是真的没有了。
下一批次要等半个月，价格也不是这个价了。

想要的姐妹，现在就下手！`;
  },

  social_proof: (input: ScriptInput) => {
    const count = randomInt(50, 200);
    return `【看看直播间的姐妹都在抢】

刚刚过去${count}秒，已经有${randomInt(10, 30)}位姐妹下单了！

弹幕里全是好评：
✨ "已下单，期待收到"
✨ "终于蹲到了，太划算"
✨ "冲冲冲，手慢无"

姐妹们都在用脚投票，
你还犹豫什么？

好产品+好价格，错过真的会后悔！`;
  },

  risk_reversal: (input: ScriptInput) => {
    return `【最后再说一遍：你没有任何风险】

¥${input.price}买回家，
用7天，不满意？

直接退！
运费我出！
你一分钱都不损失！

但如果你喜欢呢？
那就是发现了一个宝藏！

所以，为什么要犹豫？

给自己一个机会，也给这款${input.productName}一个机会。

相信我，你会回来感谢我的！`;
  },

  bonus: (input: ScriptInput) => {
    return `【今天下单的姐妹，我再送一波福利】

💰 直播间专属价：¥${input.price}

🎁 额外福利：
• 买就送价值¥${randomInt(29, 59)}的配件
• 顺丰包邮，48小时发货
• 赠运费险，退货无忧
• 下单备注"直播"，再送小礼物

光赠品的价值都快赶上产品价格了！

这波福利，只有今天直播间有。

错过今天，想买都没这个价！`;
  },

  call_to_action: (input: ScriptInput) => {
    return `【最后${randomInt(3, 10)}分钟，我再说两句】

这款${input.productName}，我是真心推荐。

不是因为它能让我赚多少钱，
而是因为它真的能帮到姐妹们。

${input.sellingPoint.split(/[，,、]/)[0]}，
这个问题困扰了多少人？

今天¥${input.price}就能解决，
你不心动吗？

想要的姐妹，扣1，我给你们上链接！`;
  },
};

// ============= 主生成函数 =============
export function generateCreativeScript(input: ScriptInput): GeneratedScript {
  const category = detectCategory(input.productName, input.sellingPoint);
  
  // 随机选择开场风格
  const openingStyle = randomPick(Object.keys(OPENING_STYLES) as (keyof typeof OPENING_STYLES)[]);
  const openingTemplate = randomPick(OPENING_STYLES[openingStyle]);
  
  // 随机选择塑品段风格
  const shapingStyle = randomPick(Object.keys(SHAPING_TEMPLATES) as (keyof typeof SHAPING_TEMPLATES)[]);
  const shapingContent = SHAPING_TEMPLATES[shapingStyle](input);
  
  // 随机选择报价段风格
  const pricingStyle = randomPick(Object.keys(PRICING_TEMPLATES) as (keyof typeof PRICING_TEMPLATES)[]);
  const pricingContent = PRICING_TEMPLATES[pricingStyle](input);
  
  // 随机选择收割段风格
  const harvestingStyle = randomPick(Object.keys(HARVESTING_TEMPLATES) as (keyof typeof HARVESTING_TEMPLATES)[]);
  const harvestingContent = HARVESTING_TEMPLATES[harvestingStyle](input);
  
  // 组装开场白
  const opening = openingTemplate
    .replace(/\$\{productName\}/g, input.productName)
    .replace(/\$\{painPoint\}/g, input.sellingPoint.split(/[，,、]/)[0])
    .replace(/\$\{comparePrice\}/g, String(Math.round(input.price * 2.5)))
    .replace(/\$\{days\}/g, String(randomInt(7, 30)))
    .replace(/\$\{sales\}/g, String(randomInt(5000, 30000)))
    .replace(/\$\{percent\}/g, String(randomInt(70, 95)))
    .replace(/\$\{reviews\}/g, String(randomInt(1000, 10000)))
    .replace(/\$\{rating\}/g, (4.5 + Math.random() * 0.45).toFixed(1))
    .replace(/\$\{scenario\}/g, randomPick(['出门', '约会', '工作', '聚会', '拍照']))
    .replace(/\$\{seasonEvent\}/g, randomPick(['露腿', '穿裙子', '秀身材', '约会季']))
    .replace(/\$\{count\}/g, String(randomInt(10, 50)));
  
  // 组装完整话术
  const fullScript = `## 🎬 开场白

${opening}

---

## 🎯 塑品段（建立购买需求）

${shapingContent}

---

## 💰 报价段（建立价值认知）

${pricingContent}

---

## 🎁 收割段（促成立即购买）

${harvestingContent}
`;

  return {
    full_script: fullScript,
    structure: {
      shaping: `## 🎯 塑品段\n\n${opening}\n\n${shapingContent}`,
      pricing: `## 💰 报价段\n\n${pricingContent}`,
      harvesting: `## 🎁 收割段\n\n${harvestingContent}`,
    },
    style: `${openingStyle}-${shapingStyle}-${pricingStyle}-${harvestingStyle}`,
  };
}

// 根据流量等级调整话术节奏
export function adjustByTraffic(script: GeneratedScript, trafficLevel: number): GeneratedScript {
  let adjustedScript = { ...script };
  
  if (trafficLevel < 100) {
    // 低流量：更详细的讲解，建立信任
    adjustedScript.full_script = script.full_script.replace(
      '【', 
      '【姐妹们，今天咱们人不多，我正好可以详细给大家讲讲...'
    );
  } else if (trafficLevel > 500) {
    // 高流量：节奏加快，重点突出
    adjustedScript.full_script = script.full_script
      .replace(/【[^】]+】/g, (match) => `🔥 ${match.slice(1, -1)}`);
  }
  
  return adjustedScript;
}
