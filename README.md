# 1Panel Hub

使用 Vite 8、React 19、TypeScript、Semi Design 和 Tailwind CSS 4 构建的 1Panel 节点管理客户端，可运行在浏览器和 Tauri 2 桌面应用中。界面仅支持简体中文。

## 开发与构建

使用 `package.json` 中要求的 Node.js 版本与 pnpm 12。

```sh
pnpm install
pnpm web:dev      # http://localhost:3000
pnpm web:build    # 类型检查并输出 dist/
pnpm preview     # 预览构建结果
pnpm app:dev     # 启动 Tauri 桌面应用，需要 Rust 与平台构建依赖
pnpm app:build   # 构建 Tauri 桌面应用
```

`pnpm generate` 保留为 `pnpm web:build` 的兼容命令。

```sh
pnpm typecheck
pnpm lint
pnpm fmt:check
```

## 节点配置

接口按 [1Panel v2.3.2](https://github.com/1Panel-dev/1Panel/releases/tag/v2.3.2) 更新，仅接入 v2。请在 1Panel 中启用 API 接口、创建 API Key，并将当前客户端 IP 加入白名单。节点填写名称、地址、端口、HTTPS 和 API Key，多个密钥时可选填 Key ID。API Key 保存在本机 `localStorage` 中。

使用 Web Crypto API 生成 HMAC-SHA256 签名，发送 `1Panel-Token`、`1Panel-Timestamp`、`1Panel-Signature-Version: hmac-sha256`，并以 `CurrentNode: local` 访问所配置服务器。签名规则依据 [v2.3.2 的 API 鉴权源码](https://github.com/1Panel-dev/1Panel/blob/v2.3.2/core/app/auth/api_auth.go)，无需额外加密库。客户端需通过 HTTPS 或 localhost 访问以使用 Web Crypto，客户端与面板的系统时间需要同步。

首次读取 `/api/v2/dashboard/base/all/all`，之后每次请求结束三秒后读取 `/api/v2/dashboard/current/all/all`，每分钟更新基础信息与资源数量。各节点独立请求，不堆积轮询；网速和磁盘 I/O 速率按服务端采样时间与计数器差值计算，重启或计数器重置后重新采样。错误会在界面显示，概览中保留的上一次成功数据会明确标注。

支持创建、编辑与删除本地节点配置。配置弹窗左下角的「测试连接」使用当前表单值读取概览，显示结果与耗时，不保存配置。「进入面板」进入 Hub 内置后台布局，支持切换节点、返回列表与编辑配置，使用 Hash 路由支持刷新及浏览器前进、后退。第一阶段的概览包含网站、数据库、应用、计划任务与 AI 智能体数量，CPU、负载、内存、交换分区、网络、磁盘 I/O、分区、系统信息与加速设备信息；节点列表和概览共享监控采样。

节点仍使用 `localStorage['node-config']` 存储。已有节点地址会保留，旧用户名、密码和 JWT Token 不再使用，需要编辑节点补充 v2 API Key。

桌面应用使用 Tauri HTTP 插件连接节点，浏览器模式使用标准 `fetch`，需要目标 1Panel 允许当前来源的跨域请求；HTTPS 页面连接 HTTP 节点也受浏览器混合内容限制。

## 界面约定

- 优先使用 Semi Design 默认组件、布局与主题，通过公开的 `style`、`headerStyle`、`bodyStyle` 属性调整组件布局，尽量避免 `!` 修饰符和组件内部选择器。
- Tailwind CSS 按[官方 Vite 安装文档](https://tailwindcss.com/docs/installation/using-vite)使用 `@tailwindcss/vite` 接入，仅用于布局、间距和响应式工具类。
- 首页提供节点统计、状态筛选、名称与地址搜索，以及资源使用、网络流量和快捷操作卡片；桌面端和移动端共用布局，按屏宽调整网格列数。
- 按 [Tailwind Preflight 文档](https://tailwindcss.com/docs/preflight#disabling-preflight)省略全局重置层，避免干扰 Semi 默认样式。`src/styles.css` 除层与导入声明外，仅设置应用根容器高度、外边距及移动端布局变量；后台内容区单独滚动，移动端导航使用抽屉。
- 在应用入口最先加载 [Semi React 19 适配器](https://semi.design/zh-CN/ecosystem/react19)，支持 Toast、Modal 等动态挂载组件。
- `LocaleProvider` 和日期格式固定为简体中文，无语言切换或业务 i18n 依赖。浅色与深色模式使用 Semi 内置主题。
