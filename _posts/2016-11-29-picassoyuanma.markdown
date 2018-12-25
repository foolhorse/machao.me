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

`Picasso.with()` 调用 Builder 创建这个单例，主要初始化了这些：
- Downloader （默认 `Utils.createDefaultDownloader(context);` 然后返回 OkHttpDownloader）
- Cache （默认LruCache）
- ExecutorService （默认 PicassoExecutorService）
- RequestTransformer（默认不做任何处理）
- Stats 记录整个 Picasso 的网络请求次数，缓存命中次数，图像转换次数等状态
- Dispatcher
- 创建清理线程 CleanupThread 并启动，清理通过 ReferenceQueue 实现，CleanupThread  的成员变量 referenceQueue 里存的是 Action 里面不同类型 Target 的 WeakReference。
- requestHandlers 在 Picasso 的构造函数中，会初始化这个变量，放上一堆 RequestHandler


load 这个常用方法，会 new 一个 RequestCreator

submit ，把一个 Action 放进 dispatcher

一个请求大概会经过 RequestCreator - Request - Action 这几个包装

## RequestHandler.java

请求处理类，获取图片资源，通过创建不同的子类（override 两个方法：load canHandleRequest）来处理不同的图片来源。

## RequestCreator.java

构造方法会调用 Request 的 Builder，创建一个 Request.Builder 的成员变量。

还有 get() / fetch() / into() 几个方法，这几个作用类似，都是 调用 createRequest() 创建 Request ，再创建一个Action 开始获取图片。

get() 直接调用 BitmapHunter 的 forRequest() 创建 BitmapHunter，然后调用这个 bitmapHunter 的 hunt() 同步返回 bitmap。

fetch() 调用 picasso 实例的 submit() 把 action 扔进 dispatcher 。

into() 调用 picasso 实例的 enqueueAndSubmit() ：把这个 action 放进 picasso.targetToAction，再调用 submit() 把 action 扔进 dispatcher 。

fetch() 和 into() 会通过 picasso.quickMemoryCacheCheck(key) 尝试从缓存读取

## Request.java

请求封装类，对图形的操作都会记录在这里，供之后图形的创建使用，如重新计算大小，旋转角度，也可以自定义变换，只需要实现 Transformation

## Action / ImageViewAction / Target

都可以看作图片下载的任务单元 / 回调接口。代表了一个具体的加载任务，主要用于图片加载后的结果回调，有两个抽象方法: complete() 和 error() 来通知上层。
其中会使用弱引用 RequestWeakReference来包装 ImageView 或者 Target 。所以要注意使用 Target 时，不要用匿名内部类，存一个 Activity / Fragment 的 filed，或者让 Activity / Fragement 去 Implement Target。

## BitmapHunter.java

网络下载工作线程。一个 runnable 线程，

hunt()是具体的图片获取过程：检查缓存，stats跟踪图片处理过程的各个状态去记录缓存相关的数量。使用相关的 RequestHandler 调用 load 获取到 RequestHandler.Result，再调用 decodeStream() 获取到 bitmap，如果有 Transformation 操作（有目标 width 和 height 的，比如 resize ，fit 本质也是 resize 操作），则同步进行 bitmap 的 transform 操作。 

在自己的 run 方法里，也就是作为一个 线程任务 执行的时候，主要操作是：
hunt() 拿到 bitmap 之后，通过`dispatcher.dispatchComplete(this);`或者`dispatcher.dispatchFailed(this);`，扔进 dispatcher.

在 performComplete 中，会把获取到的 hunter 放进 cache 中。


## Dispatcher.java

任务调度器，创建单独的线程 DispatcherThread ，创建使用这个线程的 Handler ：DispatcherHandler 。在构造方法中启动 DispatcherThread。

通过这个 handler ，向下把新建的任务 bitmapHunter 传给 ExecutorService ，向上通过 mainThreadHandler（Picasso 实例中的 HANDLER） 把 bitmapHunter 传给主线程。（ dispatcher 会调用自己线程的 handler ，来执行 performComplete，然后 performBatchComplete，这里会 `mainThreadHandler.sendMessage(mainThreadHandler.obtainMessage(HUNTER_BATCH_COMPLETE, copy));`）

## PicassoExecutorService.java

获取图片任务的线程池，根据网络状态设置线程数量。将 bitmapHunter 包装成 FutureTask 方便控制优先级。
默认 3 个核心线程，3 个非核心线程。线程池线程总数大于核心线程数时，终止多余的空闲线程的时间是0，也就是超过线程数就直接执行超时策略。任务带优先级。

核心线程数会根据当前网络状态（WIFI，4G，3G，2G）来修改。

任务使用 PicassoFutureTask，有成员变量 hunter（BitmapHunter），使用 BitmapHunter 的 getPriority方法来比较优先级。

## Downloader.java

一个下载接口，用来封装不同的Http库，子类可以选择各种不同的库来实现下载功能。

## Cache.java

内存缓存，子类 LruCache 采用 Least Recently Used 算法，使用 LinkedHashMap 作为数据结构，LinkedHashMap 自带 LRU 策略，只需根据配置的缓存大小调用 trimToSize。配合 Stats 计数 实现缓存大小的管理

本地文件缓存，Picasso 并没有，需要 Downloader 的子类自己实现，如果使用 OkHttpDownloader 或者 UrlConnectionDownloader 的话，已经实现了文件缓存。

