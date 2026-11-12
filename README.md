# machao.me

个人静态博客，使用 GitHub Pages 内置的 Jekyll 构建。

日常只需在 `_posts/` 中编写 Markdown，提交并推送到发布分支，GitHub Pages 自动构建和发布。无需本地安装 Ruby/Jekyll，也无需维护 Gemfile、版本锁文件或自定义 Actions 工作流。

- `_posts/`：文章，文件名为 `YYYY-MM-DD-slug.markdown`，Front Matter 填写 `layout: post`、`title`、`date` 和 `tags`。
- `_layouts/`、`_includes/`：页面模板和公共组件。
- `css/main.scss`、`_sass/`：样式，保留 GitHub Pages 内置 Sass 支持的语法。
- `_config.yml`：站点信息，时区固定为 UTC，以保留历史文章地址。
- `CNAME`：自定义域名 `machao.me`。

外观采用 680px 单栏阅读区、大标题使用本机衬线字体，正文使用系统无衬线字体，不加载外部字体。浅暗配色在 `_sass/_base.scss` 中，布局在 `_sass/_layout.scss` 中。默认跟随系统外观，导航中的按钮可手动切换，选择保存在当前浏览器；禁用 JavaScript 时仍会通过 CSS 跟随系统外观。



## 中英文文章与界面

文章默认使用中文（`zh`），历史文章无需修改。发布英文文章时，在 Front Matter 增加 `lang: en`，例如：

```yaml
---
layout: post
title: An English Article
date: 2026-11-12 12:00:00 +0800
lang: en
---
```

文章语言在 GitHub Pages 构建时写入 HTML 的 `lang`、文章区域的 `lang` 和 `BlogPosting` 的 `inLanguage`；首页的文章链接也标注对应语言。标题与摘要沿用文章自身内容，因此英文文章应使用英文标题和开头摘要。语言字段不改变文章 URL，也不改变构建时区。

界面文案集中在 `_data/i18n.yml`。首页默认中文，英文文章默认英文界面；导航中的 `EN` / `中文` 按钮仅切换界面，选择保存在浏览器中，并优先于页面默认值。禁用 JavaScript 时仍有构建时生成的完整导航和语言标记。文章标题、正文和关于页内容不会被自动翻译，切换界面不改变文档或文章的语言标记。首页始终按时间显示全部语言的文章。

目前每篇文章只有自己的 canonical URL，不生成 `hreflang`。将来同一篇文章有不同 URL 的真实译文时，再添加版本关联；内容不同的中英文文章不能作为彼此的语言版本。
