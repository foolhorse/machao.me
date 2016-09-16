---
layout: post
title:  "Java线程池使用笔记"
date:   2016-09-16 17:14:00 +0800
tags: develop java concurrent
published: true
---

## 构造函数

ThreadPoolExecutor (int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler)

### corePoolSize

线程池中所保存的核心线程数。线程池启动后默认是空的，只有任务来临时才会创建线程以处理请求。prestartAllCoreThreads方法可以在线程池启动后即启动所有核心线程以等待任务。

### maximumPoolSize

线程池允许创建的最大线程数。当workQueue使用无界队列时（如：LinkedBlockingQueue），则此参数无效。

### keepAliveTime

当前线程池线程总数大于核心线程数时，终止多余的空闲线程的时间。

### unit

keepAliveTime 参数的时间单位。

### workQueue

工作队列，如果当前线程池达到核心线程数时（corePoolSize），且当前所有线程都处于活动状态，则将新加入的任务放到此队列中。几个常用的：

ArrayBlockingQueue 基于数组结构的有限队列，此队列按FIFO原则对任务进行排序。如果队列满了还有任务进来，则调用拒绝策略。
LinkedBlockingQueue 基于链表结构的无限队列，此队列按FIFO原则对任务进行排序。因为它是无界的，根本不会满，所以采用此队列后线程池将忽略拒绝策略（handler）参数；同时还将忽略最大线程数（maximumPoolSize）等参数。
SynchronousQueue 直接将任务提交给线程而不是将它加入到队列，实际上此队列是空的。每个插入的操作必须等到另一个调用移除的操作；如果新任务来了线程池没有任何可用线程处理的话，则调用拒绝策略。其实要是把maximumPoolSize设置成最大（Integer.MAX_VALUE）的，加上SynchronousQueue队列，就等同于Executors.newCachedThreadPool()。
PriorityBlockingQueue 具有优先级的队列的有界队列，可以自定义优先级；默认是按自然排序，可能很多场合并不合适。

### handler

拒绝策略，当线程池与workQueue队列都满了的情况下，对新加任务采取的策略。几个常用的：

AbortPolicy 拒绝任务，抛出RejectedExecutionException异常。默认值。
CallerRunsPolicy 直接在调用处的线程执行
DiscardOldestPolicy 如果执行程序尚未关闭，则位于工作队列头部的任务将被删除，然后重试执行程序（如果再次失败，则重复此过程）。这样的结果是最后加入的任务反而有可能被执行到，先前加入的都被抛弃了。
DiscardPolicy 加不进的任务都被抛弃了，同时没有异常抛出。

## 过程

一个任务进来（Runnable）时，如果核心线程数（corePoolSize）未达到，则直接创建线程处理该任务。
如果核心线程数已经达到则该任务进入工作队列（workQueue）。
如果工作队列满了（有限队列），则检查最大线程数（maximumPoolSize）是否达到，
如果没达到最大线程数（maximumPoolSize）则创建线程处理任务（FIFO），
如果最大线程数据也达到了，则调用拒绝策略（handler）。
如果 workQueue 使用 LinkedBlockingQueue 队列，因为它是无限的，队列永远不会满，所以maximumPoolSize参数是没有意义的，同样keepAliveTime、unit、handler三个参数都无意义。

## 几个静态工厂方法

推荐使用几个现成的静态工厂方法生成的线程池
To be useful across a wide range of contexts, this class provides many adjustable parameters and extensibility hooks. However, programmers are urged to use the more convenient Executors factory methods newCachedThreadPool() (unbounded thread pool, with automatic thread reclamation), newFixedThreadPool(int) (fixed size thread pool) and newSingleThreadExecutor() (single background thread), that preconfigure settings for the most common usage scenarios.

```
public static ExecutorService newSingleThreadExecutor() {
  return new FinalizableDelegatedExecutorService
  (new ThreadPoolExecutor(1, 1,
  0L, TimeUnit.MILLISECONDS,
  new LinkedBlockingQueue<Runnable>()));
  }
```

```
public static ExecutorService newFixedThreadPool(int nThreads) {
  return new ThreadPoolExecutor(nThreads, nThreads,
  0L, TimeUnit.MILLISECONDS,
  new LinkedBlockingQueue<Runnable>());
  }

```

```
public static ExecutorService newCachedThreadPool() {
  return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
  60L, TimeUnit.SECONDS,
  new SynchronousQueue<Runnable>());
  }
```

## 参考
https://developer.android.com/reference/java/util/concurrent/ThreadPoolExecutor.html

 