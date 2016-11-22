---
layout: post
title:  "Android触摸模式"
date:   2016-11-23 00:40:00 +0800
tags: develop android
published: true
---
# Android的TouchMode

## 触摸模式

当用户使用 方向键 或 轨迹球 操作用户界面时，必须聚焦到可操作项目上（如按钮），以便用户看到将接受输入的对象。 但是，如果设备具有触摸功能且用户开始通过触摸界面与之交互，则不再需要突出显示项目或聚焦到特定视图对象上。 因此，有一种交互模式称为“触摸模式”。

### 进入触摸模式

对于支持触摸功能的设备，当用户触摸屏幕时，设备会立即进入触摸模式。

### 退出触摸模式

无论何时，只要用户点击方向键或滚动轨迹球，设备就会退出触摸模式 并 找到一个视图使其获得焦点。 现在，用户可在不触摸屏幕的情况下继续与用户界面交互。

### 触摸模式状态作用范围

触摸模式状态的范围是整个系统（所有窗口和 Activity）的。调用 isInTouchMode() 来检查设备目前是否处于触摸模式。

### 监听变化

ViewTreeObserver.OnTouchModeChangeListener

## 焦点

### 焦点的状态

isFocusable()  是否能够聚焦

setFocusable() 设置是否能够聚焦 。xml属性 android:focusable

isFocusableInTouchMode() 是否可以在触摸模式中聚焦

setFocusableInTouchMode() 设置 是否可以在触摸模式中聚焦。xml属性 android:focusableInTouchMode

requestFocus() 请求获得焦点

View.OnFocusChangeListener - onFocusChange()  当用户使用导航键或轨迹球导航到或远离项目时，将回调此方法。

### 焦点的移动

系统会设置一套默认线路

如果需要自定义，可以通过重写以下 XML 属性： nextFocusDown、 nextFocusLeft、 nextFocusRight和 nextFocusUp。

### 焦点的获得和失去

在非触摸模式下，焦点的移动是靠方向键或者轨迹球之类进行控制

在触摸模式下，被点击的view如果isFocusableInTouchMode()为true的话，并且此view此时并没获得焦点，则获得焦点，不执行onClick事件，如果此时已经获得焦点，则执行onClick事件。如果isFocusableInTouchMode()为false的话，焦点不变，直接执行onClick事件。

### 监听变化

ViewTreeObserver.OnGlobalFocusChangeListener

## 一些有用的参考

https://developer.android.com/guide/topics/ui/ui-events.html#TouchMode

http://android-developers.blogspot.jp/2008/12/touch-mode.html

http://www.101apps.co.za/index.php/articles/what-you-should-know-about-android-touch-mode-and-focus.html
 