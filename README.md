# machao.me

个人静态博客，使用 GitHub Pages 内置的 Jekyll 构建。

日常只需在 `_posts/` 中编写 Markdown，提交并推送到发布分支，GitHub Pages 自动构建和发布。无需本地安装 Ruby/Jekyll，也无需维护 Gemfile、版本锁文件或自定义 Actions 工作流。

- `_posts/`：文章，文件名为 `YYYY-MM-DD-slug.markdown`，Front Matter 填写 `layout: post`、`title`、`date` 和 `tags`。
- `_layouts/`、`_includes/`：页面模板和公共组件。
- `css/main.scss`、`_sass/`：样式，保留 GitHub Pages 内置 Sass 支持的语法。
- `_config.yml`：站点信息，时区固定为 UTC，以保留历史文章地址。
- `CNAME`：自定义域名 `machao.me`。

外观采用 680px 单栏阅读区、大标题使用本机衬线字体，正文使用系统无衬线字体，不加载外部字体。浅暗配色在 `_sass/_base.scss` 中，布局在 `_sass/_layout.scss` 中。默认跟随系统外观，导航中的按钮可手动切换，选择保存在当前浏览器；禁用 JavaScript 时仍会通过 CSS 跟随系统外观。


