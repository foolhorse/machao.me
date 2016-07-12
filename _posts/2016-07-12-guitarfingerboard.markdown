---
layout: post
title:  "Guitar Finger Board"
date:   2016-07-12 23:52:00 +0800
tags: product music
published: true
---

## 简介

这个小玩意可以显示不同调的不同音阶在吉他指板上的位置，key 和 scale 都可以修改，吉他每根弦的调音也可以分别修改。在线使用：[Guitar Finger Board](http://www.foolhorse.com/GuitarFingerBoard/) 

## 目标

平时弹琴总需要在指板上推倒不同调的不同音阶，嫌麻烦所以写了这个小程序用，如果大家想要什么其他的功能可以告诉我也可以不告诉我，我有可能写也有可能不写，也欢迎提 pull request。

## 实现原理

用了个数组常量存着十二平均律，每个不同的scale也都是数组常量，scale 的数组存的是 scale 对应十二平均律的位置 position，因为只是存了个位置，所以暂时没法区别上行和下行音阶，所以 melodic scale 的显示不是很贴切。

修改 key 本质上就是把十二平均律的开始位置做个 offset，然后 scale 里的位置对应 offset 之后的 12 个音就是所需要的这个key的这个scale了。

在指板上找出这些音的方法：先找到空弦音对应当前key的12个音的position，然后往后每升高一品就是这个position＋1位置的那个音，如果这个音同是还属于当前scale则在指板上标记出来，如果不是就空着，如果 position＋1 超过了数组长度就从头开始，所以这个程序的底层上暂时还没法区别不同八度的音。

## 后续功能

加个根音的特殊标记。

有空的话把界面做精致一些。

我发现jQuery这个库的加载时间占整个页面加载时间的很大一部分，而这个小玩意只用了它不几个api，所以干脆把jQuery这个依赖去掉得了，去掉的话还可以方便支持离线使用。







 