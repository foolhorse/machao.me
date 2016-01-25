---
layout: post
title:  "ProGuard笔记"
date:   2015-09-01 00:00:00 +0800
tags: android
published: true
---

注意下面这些没法自动keep：
没被Java代码调用，只被Jni回调的类
只通过运行时的反射调用的类或者函数或者属性


不混淆某个包下的所有类
-keep class 
com.foolhorse.example.** { * ; }

不混淆某个类
-keep class 
com.foolhorse.example.TestCls { * ; }

不混淆某个接口
-keep interface 
com.foolhorse.example.TestItf { * ; }

不混淆某个内部类
-keepattributes InnerClasses,...
-keep class com.foolhorse.example.TestCls { * ; }
-keep class com.foolhorse.example.TestCls$InnerCls { * ; }

不混淆某个类的某个函数
keepclassmembers class
com.foolhorse.example.TestCls {
public void setNameStr(java.lang.String);
}

不混淆某个类的某个构造函数
-keepclassmembers class
com.foolhorse.example.TestCls {
public <init>(java.lang.String);
}

不混淆某个类的所有子类
-keep class * extends com.foolhorse.example.TestCls
 
