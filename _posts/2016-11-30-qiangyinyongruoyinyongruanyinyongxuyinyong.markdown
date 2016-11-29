---
layout: post
title:  "强引用弱引用软引用虚引用"
date:   2016-11-30 00:10:00 +0800
tags: develop java 
published: true
---

# 强引用 弱引用 软引用 虚引用

## Strong Reference

当一个对象 没有 任何强引用 指向它 时，并且 也没有 软引用 指向它时， GC 将回收这个对象。

Java 的默认的引用方式。

## WeakReference

当一个对象 没有 任何强引用 指向它 时，并且 也没有 软引用 指向它时， GC 将回收这个对象。

也就是说弱引用不被考虑。

## SoftReference

当一个对象 没有 任何强引用 指向它 时，并且 也没有 软引用 指向它时， GC 将回收这个对象。

如果有软引用指向这个对象，则尽可能长的保留这个对象，直到 JVM 内存不足时才会被回收。

## PhantomReference

get() 永远返回 null。GC之后某些过程有些不同。

## ReferenceQueue

ReferenceQueue 可以作为参数传给一个 Reference 的构造函数， 当对象被回收时， 虚拟机自动将这个 Reference 的实例 插入到
ReferenceQueue 中。

## WeakHashMap

使用 WeakReference 作为 key， 一旦没有指向 key对象 的强引用，GC 执行将回收这个 key对象 和 key 对应的 value。

内部是通过 ReferenceQueue 完成。




