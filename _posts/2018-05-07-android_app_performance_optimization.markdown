---
layout: post
title: "Android 应用开发性能优化提纲"
date: 2018-05-07 23:40:00 +0800
tags: develop android
published: true
---
# 「已发布」Android 应用开发性能优化提纲

** 要进行优化，请先确定主要次要瓶颈是什么！ **

【UPDATE】Android Studio 3.2 之后，Android Device Monitor 已经被 Android Studio 内置的功能取代。文中提到的一些工具，做了响应的更新。如果依旧要使用Android Device Monitor，可以在 SDK 目录下 `android-sdk/tools/`找到`monitor`

## 布局和绘制

布局和绘制如果有问题会直接造成 UI 卡顿，甚至 ANR

### 布局

布局会出现的主要问题是层级过多和布局重叠。以及界面业务逻辑的实现混乱，非必要逻辑，以及重复的 inflate。

避免布局重叠（过度绘制）。使用开发中选项的调试 GPU 过度绘制功能检查

使用 merge 减少层级，include 减少布局内重复内容，viewstub 懒加载，注意 include 可能导致层级增加，最好搭配 merge 达到少增加一个层级的效果。

不使用 AbsoluteLayout，除非 APP 永远只适配一种机型。

避免布局层级过多过于复杂，

~~使用 Hierarchy Viewer  检查试图层级。~~
如果使用 Android studio 3.1 以上的版本，直接使用自带的 Layout Inspector 工具。

### 绘制

不要在 UI 线程中做耗时操作，比如绘制操作太多，IO 或者计算负载过重的操作。比如同一时间动画执行的次数过多。

使用开发者选项中的 GPU 呈现模式分析，选择 在屏幕上显示为条形图，动态的观察问题出现的时机。还可以使用 GPU Monitor 配合严格模式，会在主线程上做耗时操作时，闪烁屏幕。

控件 measure 的时候避免多次测量，draw 的时候避免过多的计算量或者内存开销，比如大量循环，频繁 new 对象创建内存

### UI 资源

尽量使用 xml 定义的图片

使用 dp 作为单位，不使用 px 为单位，除非特殊情况，比如一条分隔线之类的

尽量使用一套资源进行多数的适配

使用 9patch


## 内存

### 内存泄漏

参考内存泄漏那篇文章

### 自动装箱和集合类

自动装箱的过程会 new 一个原始类型对应的对象，这个过程不但使用更多的内存，并且多了 new 的调用。会造成一定的内存浪费。

各种泛型集合中常用到对原始类型自动装箱。

选择合适的集合数据类型和结构。在合适的情况下，使用 SparseArray 替代 HashMap ，可以避免自动装箱行为，使用 ArrayMap 比 HashMap 更节约内存。

### Bitmap 使用

#### 及时销毁

虽然，系统能够确认 Bitmap 分配的内存最终会被销毁，但是由于它占用的内存过多，所以很可能会超过Java 堆的限制。因此，在用完 Bitmap 时，要及时的 recycle ，给虚拟机信号：该图片可以释放了。

#### 设置合适的采样率

当要显示的区域很小，没必要将图片原尺寸加载出来，而只需要加载一个缩小过的图片，这时候可以设置一定的采样率，则可以大大减少占用的内存。
```
private ImageView iv;    
BitmapFactory.Options options = newBitmapFactory.Options();    
options.inSampleSize = 2; //图片宽高都为原来的二分之一，即图片为原来的四分之一    
Bitmap bitmap =BitmapFactory.decodeStream(cr.openInputStream(uri), null, options); iv.setImageBitmap(bitmap);   
```

#### 使用用软引用（SoftRefrence）

有时，在使用 Bitmap 后没有保留对它的引用，因此就无法调用 Recycle 函数。这种情况可以使用软引用，可以使 Bitmap 在内存不足时得到有效的释放。
```
SoftReference<Bitmap> bitmap_ref = new SoftReference<Bitmap>(BitmapFactory.decodeStream(inputstream));   
if (bitmap_ref .get() != null) {
  bitmap_ref.get().recycle();
}
```

#### 图片缓存

通常在不同的层级都会设置缓存，比如内存缓存，文件系统缓存。

LRU 算法：设置缓存图片最大数量，当图片数量超过最大值，则删除使用较少的图片，使用次数同样少的就删除更早使用的。

FTU 算法：设置图片的缓存时限，从最后一次使用算起，当达到时限即删除

FMU 算法：设置固定大小的缓存空间，当达到空间限制后删除最大尺寸的图片

### 其他媒体文件

比如视频，音频，因为处理通常会使用专门的库，需要针对性的考察。


## 性能优化

全局使用的功能使用单例模式

缓存网络请求，大文件

同步改异步

线程池


## 网络优化

避免频繁的网络请求，使用线程池管理异步网络请求

图片进行缓存

大文件上传或下载使用断点续传

非 UI 交互数据的请求，尽量集中在一个时刻处理

服务器端减少重定向次数，服务器端 API 响应时间尽量不超过 100ms，CDN 缓存静态资源，APP 客户端自带一份服务器 ip，使用 ip 直连，省去 dns 时间

HTTP 请求添加 http time out

合理使用 HTTP 的 connection 的 keep－alive

使用 HTTP 缓存（ HTTP 头信息中的 Cache－Control 和 expires 确定是否缓存请求结果）

HTTP 开启 gzip 压缩

API 使用数据小的数据形式，如 json


## 数据库优化

使用索引

返回的结果集字段尽量少

SQL 语句的拼接使用 StringBuilder

execSQL 执行原始 SQL 语句的效率更高，在封装与效率之间选择一个平衡点

一次性修改或插入多个数据，使用 SQLite 事务，适合文件存储的尽量使用文件存储

## Java 代码优化

牺牲类型安全和使用方便性，常量使用`static final` + `@XXXDef` 注解，非必要情况不使用 Enum。

减少不必要的全局变量

不必使用内部 getter 和 setter

选择合适的 Java 引用方式

某些 Java 对象注意手动回收，比如 XmlPullParserFactory、BitmapFactory、Matcher、各种流的操作和数据库的关闭，不使用的 Bitmap 对象及时 recycle，并且赋值为 null

算法优化，复杂算法用 c 完成使用 jni 调用。

使用 ~~traceview~~ Android Studio 的 CPU profiler 功能 来分析调用过程，定位卡顿问题出现的位置。

在主线程上的耗时操作过多会导致 ANR。碰到 ANR 时，系统会在 `/data/anr`目录下创建一个 `traces.txt` 文件。取出这个文件`adb pull /data/anr/traces.txt`，通过分析这个文件来定位 ANR 发生的地方。

## 业务逻辑优化

减少不必要的业务流程，比如无意义的启动画面，过早请求登录用户的信息等。


## 参考

一些调试工具：

<https://juejin.im/entry/563ae1b560b216575c53c3d6>

<https://developer.android.google.cn/studio/profile/systrace.html>

<https://developer.android.google.cn/reference/android/view/FrameMetrics.html>

