---
layout: post
title:  "Picasso源码"
date:   2016-11-29 23:40:00 +0800
tags: develop java android 
published: true
---

# Picasso源码

## Picasso.java

单例，几乎是所有操作步骤的中转站，中南海。

Picasso.with() 调用 Builder 创建这个单例，初始化 Downloader / Cache （默认LruCache）/ ExecutorService(默认PicassoExecutorService) / RequestTransformer（默认不做任何处理）/ Stats / Dispatcher 。创建清理线程 CleanupThread 并启动，清理通过 ReferenceQueue 实现，referenceQueue 里存的是 Action 里面不同类型 Target 的 WeakReference。

## RequestCreator.java

类似个 Builder 模式，除了 Builder 模式固有的设置参数的方法，还有 get() / fetch() / into() 几个方法，这几个作用类似都是 调用 createRequest() 创建 Request ，再创建一个Action 开始获取图片， get() 直接调用 BitmapHunter 的 forRequest() 创建 BitmapHunter，然后调用这个bitmapHunter 的 hunt() 同步返回 bitmap。fetch() 调用 picasso 实例的 submit() 把 action 扔进 dispatcher 。 into() 调用 picasso 实例的 enqueueAndSubmit() ：把这个 action 放进 picasso.targetToAction，再调用 submit() 把 action 扔进 dispatcher 。fetch() 和 into() 会通过 picasso.quickMemoryCacheCheck(key) 尝试从缓存读取

## Request.java

请求封装类，对图片的操作都会记录在这里，供之后图片的创建使用，如重新计算大小，旋转角度，也可以自定义变换，只需要实现Transformation

## Action.java

代表了一个具体的加载任务，主要用于图片加载后的结果回调，有两个抽象方法: complete() 和 error() 来通知上层。

## BitmapHunter.java

网络下载工作线程。一个 runnable 线程，hunt()是具体的图片获取过程：检查缓存，stats跟踪图片处理过程的各个状态去记录缓存相关的数量。使用相关的RequestHandler调用load获取到RequestHandler.Result，再调用decodeStream()获取到bitmap，如果有Transformation操作，则同步进行bitmap的transform操作。 hunt()拿到 bitmap 之后，扔进 dispatcher 。

## RequestHandler.java

请求处理类，获取图片资源，通过创建不同的子类（override 两个方法：load canHandleRequest）来处理不同的图片来源。

## Dispatcher.java

任务调度器，创建单独的线程 DispatcherThread ，创建使用这个线程的 Handler ：DispatcherHandler 。通过这个 handler 向下给ExecutorService 传 BitmapHunter，向上通过 mainThreadHandler（picasso实例中的HANDLER） 把 bitmapHunter 传给主线程。

## PicassoExecutorService.java

获取图片任务的线程池，根据网络状态设置线程数量。将 bitmapHunter 包装成 FutureTask 方便控制优先级。

## Downloader.java

一个下载接口，用来封装不同的Http库，子类可以选择各种不同的库来实现下载功能。

## Cache.java

内存缓存，子类 LruCache 采用 Least Recently Used 算法，使用 LinkedHashMap 作为数据结构，LinkedHashMap 自带 LRU 策略，只需根据配置的缓存大小调用 trimToSize。配合 Stats 计数 实现缓存大小的管理

本地文件缓存，Picasso 并没有，需要 Downloader 的子类自己实现，如果使用 OkHttpDownloader 或者 UrlConnectionDownloader 的话，已经实现了文件缓存。


    Hello World
        println();
    
    
    

