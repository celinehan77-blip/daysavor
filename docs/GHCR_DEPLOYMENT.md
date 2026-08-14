# GitHub Container Registry 发布流程

## 目标

生产服务器只运行应用，不再在 2 GB 内存实例上编译 Next.js。

```text
GitHub main
→ GitHub Actions 构建 linux/amd64 镜像
→ 推送 GHCR
→ 阿里云执行 docker compose pull
→ 健康检查通过后切换容器
```

## GitHub 配置

仓库 Actions Secrets 必须包含：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Workflow 会把这两个现有 Secret 映射为 Next.js 构建阶段所需的
`NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。AI、ASR 和
ALAPI 密钥不进入镜像，继续只保存在服务器 `/home/admin/web-beta/.env`。

Workflow 使用仓库内置 `GITHUB_TOKEN` 推送：

- `ghcr.io/celinehan77-blip/daysavor:main`
- `ghcr.io/celinehan77-blip/daysavor:sha-<完整提交 SHA>`

首次发布后，将 GHCR Package visibility 设为 Public，服务器即可只读拉取，不需要保存 GitHub Token。

## 服务器首次切换

先保留原配置：

```bash
cd /home/admin/web-beta
cp docker-compose.yml docker-compose.local-build.rollback.yml
curl -fsSL \
  https://raw.githubusercontent.com/celinehan77-blip/recipe-ticket-app-v2/main/deploy/docker-compose.ghcr.yml \
  -o docker-compose.ghcr.yml
```

拉取并切换：

```bash
docker compose -f docker-compose.ghcr.yml pull web
docker compose -f docker-compose.ghcr.yml up -d web
docker compose -f docker-compose.ghcr.yml ps
docker compose -f docker-compose.ghcr.yml logs --tail=50 web
```

## 验证

```bash
curl -fsS https://app.recipetix.top/api/deploy-health
```

响应中的 `deployCommit` 必须等于本次发布提交。

## 回滚

将 `WEB_IMAGE` 指向上一个成功提交的不可变镜像：

```bash
WEB_IMAGE=ghcr.io/celinehan77-blip/daysavor:sha-<上一个提交 SHA> \
  docker compose -f docker-compose.ghcr.yml pull web

WEB_IMAGE=ghcr.io/celinehan77-blip/daysavor:sha-<上一个提交 SHA> \
  docker compose -f docker-compose.ghcr.yml up -d web
```

不要删除旧镜像标签。每次正式发布记录提交 SHA、镜像 digest 和回滚标签。
