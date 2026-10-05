# Dark Glass Cockpit UI

一个可直接给 Codex / Claude Code / Cursor / 其他 Agent 使用的沉浸式 Dashboard UI Skill。

它把一套完整的深色驾驶舱视觉拆成可复用模块：**深色玻璃材质、WebGL 流体统计卡、3D 亚克力卡片、统一呼吸节奏、粒子核心、主题与材质配置系统**。

本仓库只描述和实现 UI / 动效 / 交互能力，不绑定任何具体业务、个人 IP、目录结构或数据源。
> **Sponsor access · source-visible · personal non-commercial use only · no redistribution**  
> “Sponsor Access / 赞赏开源” describes how the complete files are provided. It is not an OSI-approved open-source license. Access does not include commercial use, sharing, resale, or redistribution rights.

## Sponsor Access

- Sponsorship/appreciation supports creation and maintenance and may be used as the method for receiving the complete package.
- An authorized individual may study, run, modify, and use the Materials for personal non-commercial projects.
- **Company/organizational use, client work, commercial products, paid services, marketing, and any direct or indirect commercial use are prohibited.**
- **Sharing, uploading, reselling, repackaging, or redistributing the original or modified package is prohibited.**
- Commercial use requires separate prior written authorization from the copyright holder.

See `LICENSE` and `LICENSE.zh-CN.md` for the full terms.


## 核心能力

- 深黑 / 近黑驾驶舱视觉
- 半透明玻璃与亚克力材质
- 五类深色主题 + 自定义强调色
- 表面雾化与背景模糊分离控制
- WebGL 流体统计卡
- 指针扰动、质量档位与 CSS fallback
- 3D 亚克力堆栈 / 环形旋转
- 拖拽、惯性、吸附、点击聚焦、自动巡航
- 全局统一呼吸控制器
- 流体卡同步 / 错峰 / 层叠节奏
- 粒子核心启动动画与后台环境
- non-modal 实时参数面板
- localStorage 配置保存
- 字号 / UI 内容本地编辑与导出能力（参考 Demo）
- reduced-motion 与性能降级

## 快速使用

### 给 Agent 使用

把整个目录作为 Skill/规则上下文提供给 Agent，让其优先读取：

1. `SKILL.md`
2. 与当前任务有关的 `references/*.md`
3. 需要实现的 `components/*`
4. 最后参考 `examples/full-dashboard.html`

不要要求 Agent 每次都启用所有模块。`SKILL.md` 已规定能力选择规则。

### 直接查看完整 Demo

打开：

```text
examples/full-dashboard.html
```

它是单文件、无 CDN、无外部字体依赖的完整演示。

## 目录

```text
dark-glass-cockpit-ui/
├── SKILL.md
├── README.md
├── LICENSE
├── demo.html
├── references/
├── templates/
├── components/
│   ├── fluid-glass/
│   ├── acrylic-3d/
│   ├── breathing/
│   ├── particle-sphere/
│   └── theme-material/
├── examples/
└── qa/
```

## 内容边界

本包刻意不包含：

- 特定笔记软件扫描逻辑
- 阅读/未读/已读等特定业务状态
- 个人目录体系
- 个人名称、账号、IP、真实路径
- 原业务演示数字与业务队列

Demo 使用的是纯通用界面数据。

## 使用建议

### 普通后台

只启用：Base UI + Glass Material + Theme。

### 数据驾驶舱

增加：Fluid Glass。

### 资源/项目浏览

增加：Acrylic 3D。

### 展示型沉浸页面

增加：Breathing + Particle Core。

### 全能力演示

参考 `examples/full-dashboard.html`。

## 浏览器

推荐现代 Chromium / Edge / Chrome。

WebGL 不可用时流体卡自动回退到 CSS 材质；`prefers-reduced-motion` 下会降低或关闭不必要动画。

## License

This package uses the **Personal Non-Commercial Sponsor Access License v1.0**.

Personal non-commercial use only. Commercial use and unauthorized sharing, resale, public upload, or redistribution are prohibited. Commercial rights require separate written authorization. See `LICENSE` / `LICENSE.zh-CN.md`.