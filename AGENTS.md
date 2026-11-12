# 项目维护约定

- 作者使用「写 Markdown → git push → GitHub Pages 原生自动构建并发布」，不在本地维护 Jekyll 环境。
- 优先做减法：没有明确需求时，不添加 Gemfile、Ruby 版本锁定、自定义构建/部署工作流、检查脚本等维护负担。
- 保持模板和 Sass 与 GitHub Pages 内置构建环境兼容，不引入需要自定义构建的语法或依赖。
- 保留 machao.me 自定义域名及历史文章 URL。构建时区固定为 UTC，不要直接改为 Asia/Shanghai。
