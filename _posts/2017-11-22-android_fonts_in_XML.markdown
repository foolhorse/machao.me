---
layout: post
title: "Android 在 XML 布局中使用自定义字体"
date: 2017-11-22 13:13:00 +0800
tags: develop android
published: true
---
# Android 在 XML 布局中使用自定义字体

在 Android 8.0 (API level 26) 中可以在 xml 中就像其他资源一样使用自定义字体。
使用 Support Library 26 可以兼容到 API version 14 以上。

## 定义

将字体文件放在 res/font/ 目录下，没有 font 目录的话自己新建一个即可。将字体文件放在 res/font/ 目录下，字体文件会编译成 R 文件。
字体文件的名字有限制：只能是小写字母和数字还有下划线，不能用大写字母或者中划线等符号。
比如放入的文件名是：foolhorse.ttf

### 设定 font family

如果放入 res/font/ 目录的字体文件是有好几个，并且是同一个字族下的不同字体，那么可以使用 font family 来设定字族，如果只有一个字体文件，那么不设定也行。
如果使用的是 support 库的话需要再单独使用 app 把属性定义一遍。

比如放入 res/font/ 目录下的字体文件有 foolhorse_regular.ttf，foolhorse_italic.ttf，那么可以在res/font/ 目录下新建一个名字为 foolhorse.xml 的文件定义字族。

```XML
<?xml version="1.0" encoding="utf-8"?>
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
  <font
  android:fontStyle="normal"
  android:fontWeight="400"
  android:font="@font/foolhorse_regular"
  app:fontStyle="normal"
  app:fontWeight="400"
  app:font="@font/foolhorse_regular"

/>
  <font
  android:fontStyle="italic"
  android:fontWeight="400"
  android:font="@font/foolhorse_italic"
  app:fontStyle="italic"
  app:fontWeight="400"
  app:font="@font/foolhorse_italic"
 />
</font-family>

```

## 使用

可以使用 @font/foolhorse 或者 R.font.foolhorse 的形式来访问这些字体。

```XML
<TextView
  android:layout_width="wrap_content"
  android:layout_height="wrap_content"
  android:fontFamily="@font/foolhorse"/>
```

```XML
<style name="customfontstyle" parent="@android:style/TextAppearance.Small">
  <item name="android:fontFamily">@font/foolhorse</item>
</style>

```

```Java
Typeface typeface = getResources().getFont(R.font.foolhorse);
// 如果使用 support 库：
// Typeface typeface = ResourcesCompat.getFont(context, R.font.foolhorse);
textView.setTypeface(typeface);
```
