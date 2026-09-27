# 点歌单（观众自部署版）

一个自部署的个人点歌速查页：把想点的歌录入后，看直播时快速搜索、筛选，一键复制可直接粘贴到直播间的点歌弹幕。

> 定位：观众自用。数据自己录入、自己保管（SQLite 单文件），无公开分享、多人协作等功能。

## 功能

- **搜索辅助录入**：关键词搜索网易云音乐，点选候选自动填充歌名、歌手、封面
- **歌单批量导入**：粘贴网易云歌单分享链接（支持短链/分享文本/歌单 ID），预览勾选后批量导入，自动跳过重复
- **手动录入**：搜不到的歌直接手敲
- **搜索 / 筛选**：按歌名、歌手搜索，按语言筛选
- **一键复制点歌弹幕**：按自定义模板（支持 `{name}`、`{singer}` 等占位符）生成并复制
- **手气不错**：从当前筛选结果里随机抽一首
- **对比外部歌单**：拉取 songlist.cc 歌单，看重合与差集
- **下载 LRC 歌词**：搜索网易云音乐，选中歌曲后预览并保存带时间轴的 `.lrc`，有翻译/罗马音时可导出双语
- **编辑锁**：可选设置密码，防止他人误改数据

## 技术栈

React + Vite + TypeScript + Tailwind CSS + shadcn/ui ｜ FastAPI + SQLite ｜ 音乐搜索依赖 [NeteaseCloudMusicApiEnhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced)（镜像 `moefurina/ncm-api`）

整体由三个服务组成：

```text
浏览器 ──> 前端(nginx, :30426) ──/api──> 后端(FastAPI, :8000) ──> 网易云 API 服务(:3000)
                                            └──> data/songlist.db (SQLite)
```

---

## 部署方式一：分开部署（不使用 Docker Compose）

三个服务分别启动，适合想自己掌控每个环节、或部署到已有 Python/Node 环境的场景。

### 1. 启动网易云 API 服务

```bash
docker run -d --name netease-api -p 3000:3000 moefurina/ncm-api:latest
```

### 2. 启动后端（FastAPI）

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 准备配置与数据目录
cp .env.example .env        # 按需修改，见下方「配置说明」
mkdir -p data               # SQLite 数据文件目录

# 分开部署时网易云 API 在本机 3000 端口，修改 .env：
#   NETEASE_API_URL=http://localhost:3000
#   CORS_ORIGINS=*           （或填写前端实际访问地址）

.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

后端接口文档：http://localhost:8000/docs

### 3. 构建并部署前端

```bash
cd frontend
npm ci

# VITE_API_URL 填浏览器能访问到的后端地址
VITE_API_URL=http://<服务器IP>:8000 npm run build
```

构建产物在 `frontend/dist/`，用任意静态服务器伺服即可，例如：

```bash
npx serve dist          # 快速预览
# 或交给 nginx / caddy 等托管 dist 目录
```

可选——启用编辑锁：在静态根目录（`dist/`）放一个 `config.js`：

```js
window.__APP_CONFIG__ = { password: "你的密码" };
```

> 本地开发则更简单：后端照上面启动，前端 `npm run dev`（默认 http://localhost:30426，API 默认指向 http://localhost:8000）。

---

## 部署方式二：本地构建镜像（Docker / Docker Compose）

### 方式 2a：Docker Compose（推荐，一条命令）

```bash
# 可选：先编辑 docker-compose.yml 中 frontend 的 PASSWORD= 设置编辑锁密码
docker compose up --build -d
```

访问 http://localhost:30426 。数据落在宿主机 `./data/songlist.db`。

更新代码后重新构建：

```bash
docker compose up --build -d
```

### 方式 2b：纯 Docker 命令

```bash
# 1. 创建内部网络（容器间用服务名互相访问）
docker network create songlist

# 2. 网易云 API 服务（容器名必须是 netease-api，后端默认按此名字访问）
docker run -d --name netease-api --network songlist moefurina/ncm-api:latest

# 3. 后端（容器名必须是 backend，前端 nginx 按此名字转发 /api）
docker build -t songlist-backend ./backend
docker run -d --name backend --network songlist \
  -v "$(pwd)/data:/app/data" \
  songlist-backend

# 4. 前端（构建时固定 API 走 /api，由容器内 nginx 反代到后端）
docker build --build-arg VITE_API_URL=/api -t songlist-frontend ./frontend
docker run -d --name frontend --network songlist \
  -p 127.0.0.1:30426:80 \
  -e PASSWORD= \
  songlist-frontend
```

访问 http://localhost:30426 。`PASSWORD` 留空则不启用编辑锁。

> 注意：上面的端口映射只绑定了 `127.0.0.1`（仅本机可访问）。如需从其他设备直接访问，把映射改成 `-p 30426:80`（Compose 部署则修改 `docker-compose.yml` 中的 `ports`）。

---

## 配置说明

后端环境变量（`backend/.env`，模板见 `backend/.env.example`）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `sqlite:///./data/songlist.db` |
| `NETEASE_API_URL` | 网易云 API 服务地址 | `http://netease-api:3000` |
| `STARLWR_API_URL` | songlist.cc 对比数据源 | `https://api.starlwr.com` |
| `CORS_ORIGINS` | 允许的跨域来源（逗号分隔，`*` 为全部） | `http://localhost:30426` |

前端：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_URL` | 构建参数，后端 API 地址；Docker 部署固定为 `/api` | `http://localhost:8000` |
| `PASSWORD` | 前端容器环境变量，编辑锁密码，留空不启用 | 空 |

## 目录结构

```text
.
├── docker-compose.yml   # Docker Compose 一键构建启动
├── frontend/            # React 前端
├── backend/             # FastAPI 后端
└── data/                # SQLite 数据文件（Docker 挂载）
```

## 许可证

本项目为个人自部署工具，仅用于学习交流。
