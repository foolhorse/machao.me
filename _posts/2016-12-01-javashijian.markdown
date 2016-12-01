---
layout: post
title: "Java时间"
date: 2016-12-01 23:55:00 +0800
tags: develop java 
published: true
---
# Java时间

## 时间类

### Unix时间戳

当前时刻：System.currentTimeMillis();

### Data

比单纯只有数字的 Unix 时间戳多了几个功能：比较两个时间的前后等。

无参构造方法 生成的实例 就是 当前时刻

需要注意它的 toString() 方法返回的时间 带有根据当前运行环境的时区的时区信息 时间是当前时区时间

### Calendar

比 Date 进一步多了几个功能：多种初始化，定制时区，获取年月日等单项信息

TimeZone：时区

一般使用的实例都是 调用 getInstance() 获取的 GregorianCalendar

需要注意月份从 0 开始


## 时间格式化

DateFormat 和 SimpleDateFormat 

format() ：把一个 Date 转换成 某一种的显示形式

parse()：把某一种显示形式的时刻 转换成 Date

可以通过 Locale 设置不同语言

Locale：可以简单理解成地区和语言



