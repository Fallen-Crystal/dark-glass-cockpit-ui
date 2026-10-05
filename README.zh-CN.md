# 深色玻璃动态驾驶舱 UI Skill

一个可直接给 Codex / Claude Code / Cursor / 其他 Agent 使用的沉浸式 Dashboard UI Skill。

它把一套完整的深色驾驶舱视觉拆成可复用模块：**深色玻璃材质、WebGL 流体统计卡、3D 亚克力卡片、统一呼吸节奏、粒子核心、主题与材质配置系统**。

本仓库只描述和实现 UI / 动效 / 交互能力，不绑定任何具体业务、个人 IP、目录结构或数据源。
> **赞赏获取 · 源码可见 · 仅限个人非商业使用 · 禁止二次分发**  
> 本项目所称“赞赏开源”是获取方式名称，不等同于 OSI 意义上的开源许可。赞赏后获得完整文件，但不获得商业使用、分享、转售或二次分发权。

## 赞赏获取说明

- 赞赏用于支持作者的创作、整理和持续维护，并作为完整文件的获取方式。
- 获得文件后，可以个人学习、研究、运行、修改，并制作个人非商业项目。
- **禁止公司/组织内部使用、客户项目、商业产品、收费服务、商业宣传及其他直接或间接商业用途。**
- **禁止将原包或修改后的包分享、上传、转售、重新打包或二次分发。**
- 如需商业使用，必须另行取得作者/权利人的书面商业授权。

完整条款见 `LICENSE` 和 `LICENSE.zh-CN.md`。


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

本包采用 **Personal Non-Commercial Sponsor Access License v1.0（个人非商业「赞赏获取」许可协议）**。

仅允许个人非商业使用；禁止任何商业使用及未经授权的分享、转售、公开上传和二次分发。商业使用需另行取得书面授权。详见 `LICENSE` / `LICENSE.zh-CN.md`。