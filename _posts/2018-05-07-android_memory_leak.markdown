---
layout: post
title: "Android 内存泄漏"
date: 2018-05-07 23:40:00 +0800
tags: develop java android
published: true
---
# Android 内存泄漏

## 形成的原因

内存分配：

静态存储区：主要存放 static 数据、全局 static 数据和常量。这块内存在程序编译时就已经分配好，并且在程序整个运行期间都存在。

栈：局部变量 的 基本数据类型 和 引用 存储于栈中。当方法被执行时，方法体内的局部变量都在栈上创建，生命周期随方法而结束。因为栈内存的分配效率很高，但是分配的内存容量有限。

堆：通常是在程序运行时 new 出来的内存。类成员变量 全部 存储在堆中（包括基本数据类型，引用和引用的对象实体）。这部分内存在不使用时将会由 GC 来负责回收。

虚拟机的垃圾处理机制：

没有直接或者间接被 GC Roots（通常是线程的 main） 引用的对象，会被 GC 回收掉。Java 内存泄漏指的是进程中某些对象（垃圾对象）已经没有使用价值了，但是它们却直接或间接被 gc roots 引用导致无法被 GC 回收。

所以，**生命周期不同 的 对象**是重灾区。

## 常见情况和避免方式

### 持有A实例的B的生命周期 超过了 A实例的生命周期，导致A实例无法回收。

导致生命周期不一致的原因：静态，线程的异步，作用范围（ 比如用作缓存的集合数据类型，引用着里面保存的图片 ）等

#### 静态实例 所在的类

这个静态实例的类如果不是静态的，那么这个静态实例所在的类将无法回收
非静态的内部类，包括匿名内部类
某些单例模式
```
public class Demo {
    static Inner sInnerInstance = null;

    public Demo() {
        if (sInnerInstance == null) {
            sInnerInstance= new Demo();
        }
    }

    class Inner {
        void doSomething() {
            System.out.print("dosh");
        }
    }
}
```
非静态内部类默认会持有外部类的引用。

Demo 的构造方法创建了一个该非静态内部类的静态实例，该实例的生命周期和应用的一样长，该静态实例一直会持有 Demo 的引用，导致 Demo 无法正常回收。

解决：
```
public class OutterClass {

    static class InnerClass {
        private final WeakReference<OutterClass> mOutterClassInstance;
    }
}
```

#### 集合

集合类如果仅仅有添加元素的代码，而没有相应的删除机制，集合类和这个元素的生命周期不一致（比如集合是当前类的静态属性，全局性的 map 或 final 一直指向它)，会导致内存泄漏。比如通过 HashMap 做缓存时就需要注意。 

#### 线程

线程是典型的生命周期不同的情况，需要特别注意。

## Android 的常见情况和避免方式

如果泄漏对象越攒越多，没有办法被回收，最终会导致 OutOfMemory，使得 `system_process` 进程挂掉。

### Activity

想要避免 context 相关的内存泄漏，需要注意以下几点：

不要对 activity 的 context 长期引用(一个 activity 的引用的生存周期应该和activity的生命周期相同)
注意 View、 Drawable 等容易持有 Activity 的引用

如果一个 acitivity 的非静态内部类的生命周期不受控制，那么避免使用它；正确的方法是使用一个静态的内部类，并且对它的外部类有一 WeakReference，就像在 ViewRootImpl 中内部类 W 所做的那样。

持有 activity 的线程对象 mThread，确保 activity 在 destroy 后，线程已经终止，可以这样做：在 onDestroy 时调用 `mThread.join();`

针对整个应用生命周期的情况使用关于 application 的 context 来替代和 activity 相关的 context

View 会保持 Activity 的引用，Activity 同时还和其他内部对象也有可能保持引用关系。

一般通过不断改变屏幕方向，使 Activity 不断重建，可以直观的观察泄漏。


### Handler

Handler 通过发送 Message 与其他线程交互，Message 发出之后是存储在目标线程的 MessageQueue 中的，Message 并不保证马上被处理，可能会驻留比较久的时间。在 Message 类中的成员变量 target，它强引用了 handler 实例，如果 Message 在 Queue 中一直存在，就会导致handler 实例无法被回收，如果 handler 对应的类是非静态内部类 ，则会导致外部类实例（ Activity 或者 Service ）不会被回收，这就造成了外部类实例的泄露。 

正确处理 Handler 等之类的内部类，应该将自己的 Handler 定义为静态内部类，并且在类中增加一个成员变量，用来弱引用外部类实例。在 Activity 的 Destroy 或者 Stop 时使用 `removeCallbacks` 移除消息队列 MessageQueue 中的消息。

使用 HandlerThread 时，因为 HandlerThread 的 run 方法是一个无限循环，它不会自己结束，线程的生命周期超过了 activity 生命周期。应该在 onDestroy 时将线程停止掉：`mThread.getLooper().quit();`

### 广播接收器、注册观察者、系统事件的监听器

假设我们希望在锁屏界面（LockScreen）中，监听系统中的信号强度，则可以在 LockScreen 中定义一个 PhoneStateListener 的对象，同时将它注册到 TelephonyManager 服务中。

对于 LockScreen 对象，当需要显示锁屏界面的时候就会创建一个 LockScreen 对象，而当锁屏界面消失的时候 LockScreen 对象就会被释放掉。

但是如果在释放 LockScreen 对象的时候，没有取消之前注册的 PhoneStateListener 对象，则会导致LockScreen 无法被 GC 回收。内存泄了漏了。

虽然有些系统程序，它本身好像是可以自动取消注册的，但还是最好明确的手动取消注册。


### 资源源对象 File / Cursor

资源性对象比如（Cursor，File文件等）往往都用了一些缓冲，我们在不使用的时候，应该及时关闭它们，并置为 null。以便它们的缓冲及时回收内存。

它们的缓冲不仅存在于 Java 虚拟机内（GC 可以回收），还存在于 Java 虚拟机外（一些缓存逻辑，需要手动关闭）。如果我们仅仅是把它的引用设置为 null，而不关闭它们，往往会造成内存泄露。

有些资源性对象，比如 SQLiteCursor（在析构函数`finalize()`如果我们没有关闭它，它自己会调`close()`关闭)，所以就算没有手动关闭，系统在会在 GC 时也会关闭它，但是这样的效率太低了。

## Android 的调试

神器 LeakCanary
<https://github.com/square/leakcanary>

MAT(Memory Analyzer Tool)
 
Android Profiler
类似 MAT，可以在 Android studio 中直接操作，可以直接 dump 分析类的数量

正常的操作，在正常gc后，Allocated 的内存会保持在一个平稳的水平。如果 Allocated 值在每次GC后不会有明显的回落，随着操作次数的增多 Allocated 的值会越来越大，说明代码中存在没有释放对象引用的情况。



