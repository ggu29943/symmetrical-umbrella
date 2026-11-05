# 《闪电》科普短片 · 分镜脚本与配音稿（v1，待确认）

- 规格：1920×1080，16:9，60 fps，时长约 3:05–3:10（以实测配音时长为准）
- 配音：中文；字幕：中文在上、英文在下（字幕区固定在画面底部 16% 的区域，主体画面构图避开此区）
- 时间码根据真实合成语音逐句实测排定（云扬音色，+6% 语速，语音总长约 157 秒）

## 视觉总纲

- 色彩：近黑深蓝底（#05070d）。闪电核心为白色，外层是电光蓝的辉光（#cfe8ff → #6fb6ff → #3a5cff）。正电荷用暖金色，负电荷用冰蓝色。高空瞬态发光事件和火山用各自的专属色。
- 电影感：慢速镜头漂移与视差雨幕；闪电时整帧曝光、云体被体积式照亮；轻微胶片颗粒和暗角；冷暖对比。
- 闪电生成：程序化"带偏向的随机游走 + 概率分叉 + 分支亮度递减"，每道闪电现场生成，没有两道相同。每种类型使用不同的生成参数和渲染方式，详见各镜头。
- 排版：思源黑体 / Noto Sans SC。类型名采用"细线 + 双语标签"的下三分之一样式。数据卡为半透明玻璃卡片，不压字幕区。

---

## 开场

### 镜头 0 ｜0:00–0:13｜冷开场 + 片名
- 画面：全黑中渐显两层视差雨丝。云层内部两次暗闪，勾出积雨云的轮廓。0:03 一道负极性云地闪从画面上方劈到地平线：先导约 0.3 秒慢速推进，接着回击满屏曝光，闪烁 3 次后留下视网膜残影般的余辉。
- 0:09 片名「闪电」，LIGHTNING 字距缓缓拉开，文字描边被电弧逐笔点亮。副标题：「天空为何放电 · Why the Sky Sparks」。
- 声音：雨声、远雷低频；回击后约 0.8 秒雷声炸响。
- 配音（中）：一道闪电，往往不到一秒。可是，天上为什么会放电？
- 字幕（英）：A lightning flash usually lasts under a second. So why does the sky discharge electricity at all?

**章节卡 0:13–0:15**：01 闪电从何而来 · How Lightning Forms

---

## 第一部分：闪电是怎么产生的

### 镜头 1 ｜0:15–0:31｜雷暴云起电
- 画面：镜头推入积雨云，云体转为半透明剖面图（线稿 + 体积光）。左侧有高度标尺（0–15 km）和温度层（0 °C / −10 °C / −20 °C / −40 °C）。上升气流用向上流动的蓝色流线粒子表现。
- 圆形"显微镜"放大窗：六角形冰晶上升，形状不规则的霰粒下落，两者碰撞时迸出火花。"+"跟随冰晶离开，"−"留在霰粒上。
- 拉远：金色"+"在云顶聚集，蓝色"−"聚集在 −10~−20 °C 层。云底用淡色标出一个较小的正电荷区（真实结构常为"三极"）。
- 标签：冰晶 Ice crystal｜霰粒 Graupel｜上升气流 Updraft｜主负电荷区 Main negative charge region
- 角标：非感应起电理论（主流）· 微观细节仍在研究
- 配音（中）：答案在雷暴云里。上升气流托起冰晶，与下落的霰粒——松软的小冰球——不断碰撞，电荷随之分离：冰晶带正电升到云顶，霰粒带负电留在中下部。这是主流解释，细节仍在研究。
- 字幕（英）：The answer lies inside the thundercloud. Updrafts lift ice crystals, which collide again and again with falling graupel — soft pellets of ice. Charge separates: the crystals turn positive and rise to the top; the graupel turns negative and stays in the middle and lower cloud. This is the leading explanation; the details are still being studied.

### 镜头 2 ｜0:31–0:43｜地面感应与"击穿之谜"
- 画面：地面出现，地表的"+"沿着云影聚集，并随云移动。云底到地面的电场线逐渐变密，开始颤动。
- 数据卡（依次弹出）：云地电压：可达上亿伏 / over 100 million V｜空气击穿场强：约 3 MV/m（干燥空气、海平面）｜云中实测电场：通常低一个量级
- 结尾：数据卡之间浮现一个"？"，标签「闪电如何触发：尚无定论 / Initiation: unresolved」
- 配音（中）：地面随之感应出正电荷，云地电压可达上亿伏，足以击穿空气。但云中实测的电场常低于击穿所需，闪电如何点火，尚无定论。
- 字幕（英）：The ground below becomes positively charged. The voltage between cloud and ground can exceed 100 million volts — enough to break down the air. Yet fields measured inside clouds are usually weaker than breakdown requires; how lightning ignites is still unresolved.

### 镜头 3 ｜0:43–0:52｜梯级先导
- 画面：超慢镜头，右上角时间码以微秒跳动，标注「慢放」。暗紫蓝色先导一步一步向下：每一步闪亮一下再变暗，留下微弱通道，并随机分叉，部分分叉中途停止。临近地面时，一棵树和一座塔顶各伸出一条淡白色的上行先导。
- 数据卡：步长 ~50 m · 停顿 ~20–50 µs · 平均速度 ~200 km/s
- 标签：梯级先导 Stepped leader｜上行连接先导 Upward connecting leader
- 配音（中）：放电始于梯级先导：每步几十米，走走停停，边走边分叉。地面的尖端也向上伸出先导迎接。
- 字幕（英）：It starts with a stepped leader: tens of meters per step, stopping and starting, branching as it goes. Pointed objects on the ground send up leaders to meet it.

### 镜头 4 ｜0:52–1:03｜回击
- 画面：两条先导相接，亮度波前从接地点沿通道向上"灌"满整条通道，分支被一并点亮，但比主通道暗。整屏曝光闪白，随后留下余辉。
- 数据卡（逐个弹出）：速度 ~1/3 光速｜峰值电流 ~30 kA（典型值）｜温度 ~30,000 °C，旁边配一条温度对比条：太阳表面约 5,500 °C，约为 5 倍
- 标签：回击 Return stroke
- 配音（中）：两者相接，回击自下而上扫过通道：速度约为光速的三分之一，电流约三万安培，温度近三万摄氏度，是太阳表面的五倍。
- 字幕（英）：When they connect, the return stroke surges up the channel from the ground — at about a third of the speed of light, carrying around 30,000 amperes and heating the air to nearly 30,000 °C, five times hotter than the Sun's surface.

### 镜头 5 ｜1:03–1:12｜直窜先导与多次回击
- 画面：底部是一条 0–500 ms 的时间轴，竖线脉冲标出 3–5 次回击，间隔为几十毫秒（随机生成）。直窜先导是一个平滑、明亮的光头，沿原主通道快速下行（不分叉、不"走走停停"）。每次继后回击只重新点亮主通道，分支不再亮起（与真实观测一致）。画面中的闪电与时间轴同步闪烁。
- 标签：直窜先导 Dart leader｜继后回击 Subsequent return stroke
- 配音（中）：随后，直窜先导沿原通道再次下行，引发新的回击。一次闪电平均三到五次回击，所以它会闪烁。
- 字幕（英）：Then a dart leader descends the same channel, triggering another return stroke. A flash averages three to five strokes — that's why lightning flickers.

### 镜头 6 ｜1:12–1:23｜雷声的成因
- 画面 A：通道横截面特写，一个小发光圆，标注「直径约几厘米」。它瞬间膨胀，边缘锐利的白色冲击波环向外扩散，几米后边缘变柔，转为正弦声波环。标签：冲击波 Shock wave → 声波 Sound wave。
- 画面 B：拉远到侧视图，一个听者图标。闪电通道上不同高度的各段依次发出声波环，先后到达听者，底部的雷声波形逐渐长出"轰——隆隆"的拖尾。
- 声音：合成雷声，先是近处的尖锐爆裂，再接远处滚动的低频。
- 配音（中）：通道瞬间受热，空气猛烈膨胀，产生冲击波，再衰减为声波。通道各段离你远近不同，雷声便滚滚而来。
- 字幕（英）：The channel heats in an instant; the air expands violently, creating a shock wave that decays into sound. Each part of the channel lies at a different distance from you — so the thunder rolls.

**章节卡 1:23–1:25**：02 闪电的类型 · Types of Lightning

---

## 第二部分：闪电的类型（每种类型的形态和动效各不相同）

### 镜头 7 ｜1:25–1:39｜云地闪：负极性 vs 正极性
- 场景：一座带云砧的宽幅雷暴，镜头缓慢横移。
- 负极性（左）：从云中下部"−"区出发，向下密集分叉，闪烁 3–4 次，余辉偏蓝。标签：负极性云地闪 −CG · 约 90%
- 正极性（右）：从高处云砧的"+"区出发，先水平穿出云砧，再在远离雷暴核心的晴空下方劈落。分叉少、通道粗，单次回击后持续发光约 0.3 秒（连续电流），落点草地溅起火星。标签：正极性云地闪 +CG · 约 10%
- 配音（中）：云地闪约九成是负极性，常有多次回击。正极性约占一成，多从云砧发出，可落在远离雷暴核心处；通常只击一次，却更强、更久，更易引发火灾。
- 字幕（英）：About 90% of cloud-to-ground flashes are negative, often with several strokes. Positive flashes, about 10%, mostly come from the anvil and can strike far from the storm's core. They usually strike once, but stronger and longer — and are more likely to start fires.

### 镜头 8 ｜1:39–1:47｜云内闪 · 云际闪 · 云空闪
- 三联画，从左到右依次点亮：
  - 云内闪：云体内部横向"爬行"的蛛网状放电，整朵云从内部被照亮成一团体积光。标签：云内闪 Intra-cloud (IC)
  - 云际闪：两座分开的云塔之间，一道长长的拱形电弧。标签：云际闪 Cloud-to-cloud (CC)
  - 云空闪：通道从云侧窜出，末端在空中散成细丝，随后戛然中断、渐隐。标签：云空闪 Cloud-to-air (CA)
- 角标：约 3/4 的闪电不着地
- 配音（中）：约四分之三的闪电从不着地：云内闪在一朵云中，云际闪跨越两朵云，云空闪窜入晴空，戛然而止。
- 字幕（英）：About three quarters of lightning never touches the ground: intra-cloud flashes stay inside one cloud, cloud-to-cloud flashes leap between two, and cloud-to-air flashes shoot into clear air and stop dead.

### 镜头 9 ｜1:48–1:58｜片状 · 叉状 · 链状
- 片状闪电：一整面云墙不规则地闪亮 2–3 次，看不到通道。标签：片状闪电 Sheet lightning，附说明「不是独立的物理类型：被云遮住的云内闪」
- 叉状闪电：锐利的云地闪，枝杈繁多。慢速"描边"展示分支结构，分支亮度低于主干。标签：叉状闪电 Forked lightning
- 链状闪电：主通道消退时，亮度沿通道分解成一串发光的"珠子"，比通道多停留约半秒，再逐颗熄灭。标签：链状闪电 Bead lightning · 成因尚无定论
- 配音（中）：片状闪电，是藏在云里的放电照亮了整片云；叉状闪电的枝杈，是先导留下的岔路；链状闪电消退时断成一串光珠，成因尚无定论。
- 字幕（英）：Sheet lightning is a hidden discharge lighting up a whole cloud. Forked lightning's branches are side paths left by the leader. Bead lightning breaks into a string of glowing beads as it fades — its cause is still unresolved.

### 镜头 10 ｜1:59–2:07｜热闪电 · 干闪电（两个不同概念）
- 热闪电：夏夜星空和平原地平线。地平线外远处的云顶无声地闪亮。距离标尺：「> 15–20 km：通常听不到雷声」。此时音轨只留轻风，没有雷声。标签：热闪电 Heat lightning
- 干闪电：干旱山坡，云下垂着一条条雨幡（雨丝在半空消失）。一道闪电击中坡地，火星逐渐变成小火苗。标签：干闪电 Dry lightning · 雨幡 Virga
- 配音（中）：热闪电并不是热出来的，只是太远，听不见雷声；干闪电的雨在半空就蒸发了，容易引燃野火。
- 字幕（英）：Heat lightning isn't caused by heat — it's simply too far away for the thunder to be heard. Dry lightning comes with rain that evaporates in mid-air, and can easily spark wildfires.

### 镜头 11 ｜2:07–2:14｜火山闪电
- 画面：色调转为熔岩橙配电光紫蓝。火山剪影上，喷发柱以湍流粒子翻滚。火山口附近有大量细小、短促的电火花（火山口放电），柱体中高处有较大的分叉闪电。
- 标签：火山闪电 Volcanic lightning
- 配音（中）：火山灰在喷发柱中碰撞、碎裂而带电，火山也会打闪。
- 字幕（英）：Ash grains colliding and fracturing in the eruption plume become charged — so volcanoes make lightning too.

### 镜头 12 ｜2:14–2:29｜高空瞬态发光事件（TLEs）
- 画面：镜头上升穿过云顶，出现地球弧线、星空和淡绿色的气辉带。左侧为 0–100 km 高度标尺。
  - 红色精灵：云下先亮起一次正极性闪电，随即在 50–90 km 处闪现红色"水母"：上部为弥散的红光，下垂紫红色触须（程序生成）。片中适当放慢，标「慢放」。标签：红色精灵 Red sprite
  - 蓝色喷流：从云顶向上喷出一道蓝色锥形流光，呈扇形细丝，到达约 40–50 km。标签：蓝色喷流 Blue jet
  - ELVES：约 90 km 高处，一圈红色光环从中心急速向外扩张（透视椭圆），配直径刻度「数百公里」和「< 1 ms」。标签：ELVES（Emission of Light and VLF perturbations due to EMP Sources）
- 角标：1989 年首次拍到红色精灵
- 配音（中）：云顶之上，还有一个1989年才首次被拍到的世界：红色精灵在五十到九十公里高空一闪而过；蓝色喷流从云顶向上射出；ELVES是急速扩张的光环，直径可达数百公里。
- 字幕（英）：Above the cloud tops lies a world first photographed in 1989: red sprites flash 50 to 90 km up; blue jets shoot upward from the cloud tops; ELVES are rapidly expanding rings up to hundreds of kilometers across.

### 镜头 13 ｜2:29–2:40｜球状闪电
- 画面：雷雨夜的空旷地面，一团橙白色光球沿噪声驱动的轨迹缓慢飘行，表面闪烁，几秒后无声消失。
- 屏幕中央是半透明大字「成因尚无定论 / Cause still unknown」。周围浮现几个灰色气泡：「土壤汽化硅？」「微波？」「等离子体结构？」，统一标注「几种假说，均未证实」。
- 小插图：一条光谱带，标出硅、铁、钙的发射线，注明「2012 年观测光谱（示意图）」。
- 配音（中）：还有球状闪电：漂浮的光球，可持续数秒。2012年中国科研人员曾记录到它的光谱，但成因至今尚无定论。
- 字幕（英）：And then there's ball lightning: a floating sphere of light that can last for seconds. In 2012, Chinese researchers recorded its spectrum — but what causes it is still unknown.

**章节卡 2:40–2:42**：03 安全知识 · Staying Safe

---

## 第三部分：实用知识

### 镜头 14 ｜2:42–2:49｜数秒估算距离
- 画面：远处一道闪光，画面上的秒表加速计数 1…9，一道声波从远方推到听者处，公式落版：「9 s ÷ 3 ≈ 3 km」。
- 配音（中）：看到闪电，数到雷声响起：秒数除以三，约等于公里数。
- 字幕（英）：When you see a flash, count until the thunder. Seconds divided by three ≈ distance in kilometers.

### 镜头 15 ｜2:49–2:58｜雷暴安全
- 画面：图标卡片网格。✓ 建筑物 ✓ 硬顶汽车（关窗）✗ 孤立大树 ✗ 山顶 ✗ 水面 ✗ 空旷地带。底部是「< 30 秒 → 立即进屋｜最后一声雷后 → 等 30 分钟」，另有标语「雷声响起，即刻入室 / When thunder roars, go indoors」。
- 配音（中）：不到三十秒，就该立刻进入建筑物或硬顶汽车，远离大树、山顶和水面。最后一声雷后，再等三十分钟。
- 字幕（英）：Under 30 seconds? Get into a building or a hard-topped car right away, and stay clear of trees, hilltops and water. Wait 30 minutes after the last thunder.

---

## 结尾

### 镜头 16 ｜2:58–3:08｜收束
- 画面：地球夜半球的剪影上，各处随机亮起细小的闪光点，计数器从 0 增长到约 8,000。镜头推近黑场，最后一道闪电在黑暗中生成，通道慢慢冷却成暗红余辉，渐隐至全黑。
- 配音（中）：这三分钟里，地球上亮起了约八千道闪电。没有哪两道，走过同一条路。
- 字幕（英）：In these three minutes, about 8,000 flashes have lit up the Earth. No two have followed the same path.

---

## 科学数字自查表

| 片中说法 | 公认量级 / 依据 | 结论 |
|---|---|---|
| 一次闪电"往往不到一秒" | 典型闪电总时长约 0.2–0.5 秒，少数可超过 1 秒 | ✓（用"往往"留余地） |
| 云地电压"可达上亿伏" | 文献常引 10⁸–10⁹ V 量级（美国 NOAA 引用"可达约 3 亿伏"） | ✓ |
| 空气击穿约 3 MV/m；云中实测通常低一个量级 | 干燥空气、海平面约 3 MV/m；云中实测最大约 0.1–0.4 MV/m（Dwyer & Uman 2014 综述） | ✓ 触发机制标"尚无定论" |
| 起电机制 | 冰晶—霰粒碰撞的"非感应起电"是主流理论，电荷符号与温度、液态水含量有关，微观细节仍有争议 | ✓ 标"主流解释、细节仍在研究" |
| 云上正、中下负 | 典型结构为"三极"：上部正、中部主负电荷区（约 −10~−20 °C 层）、底部较小正区 | ✓ 片中以主偶极为主，底部小正区用淡色示意 |
| 梯级先导步长 ~50 m，停顿 ~20–50 µs，平均速度 ~2×10⁵ m/s | Rakov & Uman《Lightning: Physics and Effects》典型值 | ✓ |
| 回击速度约 1/3 光速 | 典型 1/3–1/2 c（约 10⁸ m/s） | ✓ |
| 峰值电流约 3 万安培 | 负极性首次回击中值约 30 kA；正极性可超过 300 kA | ✓ |
| 通道温度近 3 万摄氏度，约为太阳表面的 5 倍 | 光谱测量峰值约 30,000 K；太阳表面约 5,800 K（约 5,500 °C），比值约 5.2–5.4 | ✓ |
| 平均 3–5 次回击，间隔几十毫秒 | 负极性云地闪平均 3–5 次，间隔典型约 60 ms | ✓ |
| 通道直径几厘米 | 回击通道热核约 1–4 cm | ✓ |
| 冲击波在数米内衰减为声波 | 冲击波阶段仅维持在通道附近数米范围 | ✓ |
| 负极性约九成，正极性约一成 | 全球云地闪中正极性约占 10% 或更少 | ✓ |
| 约四分之三的闪电不着地 | 全球云闪与云地闪之比约 3:1（各地差异很大，约 1:1 到 10:1） | ✓（"约"） |
| 热闪电：太远听不见雷声 | 雷声通常在约 15 km 内可闻，少数可达约 25 km | ✓ |
| 红色精灵 50–90 km，持续几毫秒，1989 年首次拍到 | 1989 年 7 月由明尼苏达大学团队意外拍到（Franz 等，Science 1990） | ✓ |
| 蓝色喷流向上到约 40–50 km | 1994 年机载观测（Wescott 等 1995） | ✓ |
| ELVES 约 90 km 高，直径可达数百公里，< 1 ms | 由强闪电的电磁脉冲加热低电离层所致 | ✓ |
| 球状闪电光谱，2012 年 | 2012 年 7 月在青海由西北师范大学团队偶然记录（Cen 等，Phys. Rev. Lett. 2014），光谱含 Si、Fe、Ca | ✓ 成因明确写"尚无定论" |
| 链状闪电成因 | 有通道粗细变化、视角、箍缩不稳定等多种假说 | ✓ 写"尚无定论" |
| 三秒约一公里 | 声速约 343 m/s（20 °C）→ 3 s ≈ 1.03 km | ✓ |
| 30 秒 / 30 分钟法则 | 常用的雷暴安全经验法则；30 秒约等于 10 km | ✓ |
| 三分钟约八千道闪电 | 全球平均约 44 ± 5 次/秒（Christian 等 2003，OTD 卫星），180 s × 44 ≈ 7,900 | ✓ |

## 制作与交付方案

1. 实现方式：单个 HTML + JavaScript（Canvas 2D）作为"引擎"，包括可设种子的随机数、闪电生成器（随机游走 + 分叉）、多层辉光渲染、场景时间线、双语字幕排版，音效用 Web Audio 合成。
2. 成品 A：`lightning.html`，用浏览器打开后点击播放，可直接观看或录屏。每次加载都重新随机生成闪电。
3. 成品 B：`lightning_1080p60.mp4`，用无头浏览器逐帧离线渲染（约 11,000 帧，保证真正的 60 帧不掉帧），再由 ffmpeg 编码为 H.264 + AAC。字幕烧录进画面，另附双语 `.srt`。这个文件可直接在 iPad 上保存和播放。
4. 送到 iPad：MP4 会直接在本对话里发给你（在 iPad 上的 Claude App 中打开 → 分享 → "存储视频"或"存储到文件"）。如果你同意，也可以推送到 GitHub 仓库备份；文件大小会控制在 100 MB 以内，以符合 GitHub 的单文件限制。
