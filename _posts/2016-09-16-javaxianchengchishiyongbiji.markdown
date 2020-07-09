---
layout: post
title:  "Java线程池使用笔记"
date:   2016-09-16 17:14:00 +0800
tags: develop java concurrent
published: true
---


Java 的 Executor 接口定义了 线程池的功能。就是一个 `void execute(Runnable command);`，执行一个 Runnable。实现类来确定如何去执行。

ExecutorService 接口继承了 Executor 接口 ， 定义了一些 除了 execute 方法之外的方法。

AbstractExecutorService 抽象类 实现了 ExecutorService 接口 ， 实现了一些模版方法

ThreadPoolExecutor 继承了 AbstractExecutorService 抽象类

Executors 中有一些静态的工具方法，比如 newFixedThreadPool 之类的用来定义常用的线程池，就是定制的 ThreadPoolExecutor

ThreadPoolExecutor 中，线程分核心线程 和 非核心线程。  
核心线程数量通常是 CPU 的核心数或者多一两个。
默认情况下，核心线程在线程池中一直保持存活状态。但如果 allowCoreThreadTimeOut 属性为 true，则不保证一直存活，会与非核心线程一样，处于空闲状态一段时间后（keepAliveTime），根据超时策略做处理。

## 构造函数

```
ThreadPoolExecutor (int corePoolSize, int maximumPoolSize, long keepAliveTime, TimeUnit unit, BlockingQueue<Runnable> workQueue, ThreadFactory threadFactory, RejectedExecutionHandler handler)
```
### corePoolSize

线程池中保证一直存活的线程数。线程池启动后默认是空的，只有任务来临时才会创建线程以处理请求。prestartAllCoreThreads 方法可以在线程池启动后立即启动所有核心线程以等待任务。  
prestartCoreThread 方法可以在线程池启动后立即启动一个核心线程以等待任务。  

### maximumPoolSize

线程池允许创建的最大线程数。也就是最大并发数。当 workQueue 使用无界队列时（如：LinkedBlockingQueue），则此参数无效。

### keepAliveTime
 
当前线程池线程总数大于核心线程数时，空闲线程的等待时间，超过就会被终止。

### unit 

keepAliveTime 参数的时间单位。

### workQueue

工作队列，如果当前线程池中运行的活动状态线程数量达到核心线程数时（corePoolSize），则将新加入的任务放到此队列中。几个常用的：

- ArrayBlockingQueue 基于数组结构的有限队列，此队列按 FIFO 原则对任务进行排序。如果队列满了还有任务进来，则调用拒绝策略。

- LinkedBlockingQueue 基于链表结构的无限队列（也可以设置容量成为），此队列按 FIFO 原则对任务进行排序。如果使用无界的，根本不会满，所以采用此队列后线程池将忽略拒绝策略（handler）参数，也会忽略最大线程数（maximumPoolSize）等参数。

> 使用无界的 LinkedBlockingQueue 做为工作队列时需要非常小心，当任务耗时较长时可能会导致大量新任务在队列中堆积最终导致 OOM

- SynchronousQueue 直接将任务提交给线程而不是将它加入到队列，实际上此队列是空的。每个插入的操作必须等到另一个调用移除的操作；如果新任务来了线程池没有任何可用线程处理的话，则调用拒绝策略。

> 其实要是把 maximumPoolSize 设置成最大（`Integer.MAX_VALUE`）的，并且使用 SynchronousQueue 队列，就等同于 `Executors.newCachedThreadPool()`。

- PriorityBlockingQueue 具有优先级的队列的有界队列，可以自定义优先级；默认是按自然排序。

- DelayedWorkQueue 默认大小是16，但是可以动态增长，最大值则是int的最大值

### threadFactory

线程池中创建新线程的工厂接口，ThreadFactory 只有一个方法 `Thread newThread(Runnable r)`

### handler　　　　　　

拒绝策略，当线程池与 workQueue 队列都满了的情况下，对新加任务采取的策略。几个常用的：

- AbortPolicy 拒绝任务，抛出 RejectedExecutionException 异常。默认值。
- CallerRunsPolicy 直接在调用处的线程执行
- DiscardOldestPolicy 如果执行程序尚未关闭，则位于工作队列头部的任务将被删除，然后重试执行程序（如果再次失败，则重复此过程）。这样的结果是最后加入的任务反而有可能被执行到，先前加入的都被抛弃了。
- DiscardPolicy 加不进的任务都被抛弃了，同时没有异常抛出。

## 任务执行过程

threadFactory - corePoolSize - workQueue - maximumPoolSize - RejectedExecutionHandler

一个任务进来（Runnable）时，如果核心线程数（corePoolSize）未达到，则直接创建线程（threadFactory）处理该任务。如果核心线程数已经达到，则判断是否加入等待队列

当前工作队列中的任务数如果没达到 工作队列 最大值，则该任务进入工作队列（workQueue），等待有正在执行的线程执行完后再执行该任务 （JDK1.6 之后如果 corePoolSize 设置为0则开启一个新线程保证有线程在执行）。如果达到最大工作队列最大值，则判断当前线程池中的任务是否达到了最大线程数（maximumPoolSize）

如果当前线程池中的任务数量没有超过最大线程数（maximumPoolSize），则创建一个非核心线程来运行任务

如果已经超过最大线程数（maximumPoolSize），则调用拒绝策略（handler）

上面的 workQueue 如果使用 LinkedBlockingQueue 队列，因为它是无限的，队列永远不会满，所以 maximumPoolSize 参数是没有意义的，同样 keepAliveTime 、unit 、handler 三个参数都无意义。

## 生命周期

线程池有 5 个生命周期状态， 
RUNNING 正常运行中
SHUTDOWN 调用了 `shutdown()` 进入此状态，在这个状态时，不再接收新任务，现有任务等到阻塞队列为空，并且线程池中的工作线程数量为0， 就转入 TIDYING 状态
STOP 调用了 `shutdownNow()` 进入此状态，在这个状态时，不再接收新任务 ，在这个状态时，等到线程池中的工作线程数量为0， 就转入 TIDYING 状态
TIDYING 进入此状态会回调 `terminated()` 方法 ，
TERMINATED

- shutdown()

（1）线程池的状态变成 SHUTDOWN 状态，此时不能再往线程池中添加新的任务，否则会抛出 RejectedExecutionException 异常。

（2）线程池不会立刻退出。直到添加到线程池中的任务（不包括等待队列中的任务）都已经处理完成，才会退出。 

注意这个函数不会等待提交的任务执行完成，要想等待包括在队列中的任务完成，可以调用：
```
public boolean awaitTermination(longtimeout, TimeUnit unit)
```

- shutdownNow()

关闭线程池并中断任务，原理也是设置成中断状态

方法定义：`public List<Runnable> shutdownNow()`

线程池的状态立刻变成 STOP 状态，此时不能再往线程池中添加新的任务。

终止等待执行的线程，并返回它们的列表；

试图停止所有正在执行的线程，试图终止的方法是调用 `Thread.interrupt()`，但是大家知道，如果线程中没有sleep 、wait、Condition、定时锁等应用, `interrupt()`方法是无法中断当前的线程的。所以，shutdownNow 并不代表线程池就一定立即就能退出，它可能必须要等待所有正在执行的任务都执行完成了才能退出。

## 几个静态工厂方法

Executors 中有几个现成的静态工厂方法生成的线程池：

### FixedThreadPool

线程数量固定，当线程处于空闲状态也不会被回收，当所有线程都处于运行任务的状态时，加入的任务会处于等待状态，直到有新线程空闲才会运行。
```
public static ExecutorService newFixedThreadPool(int nThreads) {
  return new ThreadPoolExecutor(nThreads, nThreads,
  0L, TimeUnit.MILLISECONDS,
  new LinkedBlockingQueue<Runnable>());
  }
```

### SingleThreadExecutor

内部只有一个线程，而且是核心线程，确保所有任务都在同一个线程中执行。所以这里的任务不需要处理线程的同步问题。

```
public static ExecutorService newSingleThreadExecutor() {
  return new FinalizableDelegatedExecutorService
  (new ThreadPoolExecutor(1, 1,
  0L, TimeUnit.MILLISECONDS,
  new LinkedBlockingQueue<Runnable>()));
  }
```

### ScheduledThreadPool

核心线程数是固定的，但是非核心线程数没有限制，非核心线程空闲时会被立刻回收。

适合处理定时任务。
```
public static ExecutorService newScheduledThreadPool(in t corePoolSize) {
  return new ThreadPoolExecutor(corePoolSize, Integer.MAX_VALUE,
  0, NANOSECONDS,
  new DelayedWorkQueue());
  }
```

### CachedThreadPool

线程数量不固定，最大值是 `Integer.MAX_VALUE`，只有非核心线程。因为没有核心线程，所有也没有工作队列（work queue）。所以任何任务都会被立即执行。

新任务进来时，如果线程都处于活动状态，就会创建新线程。
空闲线程也遵守超时机制。

所以，它适合处理线程耗时短，但是线程数量多的任务。
```
public static ExecutorService newCachedThreadPool() {
  return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
  60L, TimeUnit.SECONDS,
  new SynchronousQueue<Runnable>());
  }
```

### 使用

```
Runnable r = new Runnable() {
    @Override
    public void run() {
        SystemClock.sleep(3000);
    }
};

ExecutorService fixedThreadPool = Executors.newFixedThreadPool(4);
fixedThreadPool.execute(r);

ExecutorService cachedThreadPool = Executors.newCachedThreadPool();
cachedThreadPool.submit(r);

ExecutorService singleThreadExecutor = Executors.newSingleThreadExecutor();
singleThreadExecutor.submit(r);

ScheduledExecutorService scheduledThreadPool = Executors.newScheduledThreadPool(4);
scheduledThreadPool.schedule(r, 2000, TimeUnit.MILLISECONDS);
scheduledThreadPool.scheduleAtFixedRate(r, 2000, 1000, TimeUnit.MILLISECONDS);
```

## 参考
https://developer.android.com/reference/java/util/concurrent/ThreadPoolExecutor.html

 