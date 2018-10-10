---
layout: post
title: "Android View 测量布局绘制过程"
date: 2018-04-27 20:02:00 +0800
tags: develop android view measure layout draw
published: true
---
# Android View 测量 布局 绘制

## 开始

每个 Activity 会创建一个 PhoneWindow 对象，是 Activity 和整个 View 系统交互的接口。

每个 Window 都通过一个 ViewRootImpl 与一个 VIew 关联，对于 Activity来说，ViewRootImpl 是连接 WindowManager 和 DecorView 的纽带。

绘制的入口是由 ViewRootImpl 的 performTraversals 方法去依次调用 DecorView 的 measure，layout，draw 方法。

在调用 DecorView 的 measure 时，会传入 MeasureSpec 参数。这个参数是由屏幕宽高，和WindowManager.LayoutParams 得来的。

FYI：ViewGroup 是一个抽象类，所以不能直接 new 对象，所以在 xml 布局文件中不能直接使用 ViewGroup。

把大象装冰箱，总共分三步走。

<https://github.com/aosp-mirror/platform_frameworks_base/blob/donut-release/core/java/android/view/View.java#L7690>

## Measure

View 的 measure 主要作用就是调用自己的 onMeasure。它接收 MeasureSpec 类型的参数。另外就是维护一些 View 本身的状态变量。

View 的 measure 是 final，所以 View 的子类（比如 ViewGroup / 自定义控件）是不能 override 这个方法的。所以 ViewGroup 没有实现 measure 方法，也就是说，它使用的是父类 View 的 measure 。

在完成 measure 之后，可以使用 getMeasureWidth() 和 getMeasureHeight() 获得经过 measure 之后的控件尺寸。

### onMeasure

onMeasure 的功能是测量自身的尺寸。

测量完成后调用 setMeasuredDimension 保存。

View 类中有一个的 onMeasure 实现。抽象类 ViewGroup 中没有 onMeasure 的实现，所以默认的 onMeasure 也是父类 View 的 onMeasure 。

通常，自定义的 View 和 ViewGroup 都需要根据自身业务逻辑实现自己的 onMeasure。

### View.onMeasure 

View 类中默认 onMeasure 方法，会测量自身的尺寸，并调用自身的 setMeasuredDimension 保存尺寸。（因为不是 ViewGroup ，所以只测量自身，不涉及下层 View ）

其中调用 getDefaultSize 时，因为 View 本身没有业务逻辑，所以会将 `WRAP_CONTENT` 的情况像 `MATCH_PARENTS` 一样填满父控件，所以自定义 View 如果需要支持 `WRAP_CONTENT` ，需要重写 onMeasure方法。
```
protected void onMeasure( int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension( getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec),
            getDefaultSize(getSuggestedMinimumHeight(), heightMeasureSpec));
}
```
getSuggestedMinimumWidth 功能是计算「内容」尺寸，在没有业务逻辑的 View 类中，计算方法是：根据有没有背景，背景最小尺寸，View 的 minWidth 来获取。
```
protected int getSuggestedMinimumWidth () {
    return (mBackground == null) ? mMinWidth : max(mMinWidth , mBackground.getMinimumWidth());
}
```
getDefaultSize ，功能是根据 getSuggestedMinimumWidth 得到的「内容」尺寸，再根据上层 View 对当前 View 的限制 measureSpec，得到最终尺寸。

计算方式是：当前 View 的 MeasureSpec 的 mode 是 UNSPECIFIED 时，使用「内容」尺寸，如果是 AT_MOST 或者 EXACTLY，使用 MeasureSpec 的尺寸（这里因为没有业务逻辑的 View，不区分 AT_MOST 或者 EXACTLY，所以布局中的 View ，设置 wrap_content 并不起作用）。
```
public static int getDefaultSize (int size, int measureSpec) {
    int result = size;
    int specMode = MeasureSpec. getMode(measureSpec);
    int specSize = MeasureSpec. getSize(measureSpec);
    switch (specMode) {
    case MeasureSpec. UNSPECIFIED:
        result = size;
        break;
    case MeasureSpec. AT_MOST:
    case MeasureSpec. EXACTLY:
        result = specSize;
        break;
    }
    return result;
}
```
在自定义 View 时，根据当前 View 的「内容」尺寸和上层 View 对当前 View 的限制（MeasureSpec），得到一个符合限制的尺寸这一步。可以使用 View 类的`resolveSize()`。这个方法的业务逻辑就是正常逻辑。

### ViewGroup.onMeasure 

ViewGroup **实现类**的 onMeasure 的实现方式，基本上，分两大步🚶🚶：遍历下层 View，计算自身。
遍历下层 View 也分两大步：计算 MeasureSpec，调用下层 View 的 measure 形成递归。

遍历所有下层 View：
遍历到每个下层 View 时，先计算它的 MeasureSpec，（计算可以使用 ViewGroup 的 measureChild 调用 getChildMeasureSpec 方法）

然后把得到的 MeasureSpec 作为参数调用下层 View 的 measure，形成递归。

如果这个下层 View 是 ViewGroup 子类，则继续遍历它的下层 View，如果是个**底层** View，则根据这个底层 View 的自身业务逻辑测量尺寸，这里会有几个参数，一个是包含了上层 ViewGroup 尺寸限制的 MeasureSpec，一个是根据自身业务计算得到到「内容」尺寸，选择一个合适的尺寸保存（`setMeasuredDimension `）。View 的默认实现是：`setMeasuredDimension( getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec),
            getDefaultSize(getSuggestedMinimumHeight(), heightMeasureSpec));`

遍历结束时，或者遍历过程中，随着下层 View 的逐渐测量完毕（当前 ViewGroup **实现类**的「内容」尺寸），根据当前 ViewGroup **实现类**自身业务逻辑，得出当前 ViewGroup **实现类** 自身的尺寸并保存。

一个 View ，margin 的计算，由它上一层的 ViewGroup 负责，padding 的计算，算到「内容」尺寸中。

ViewGroup 提供了几个通用的测量下层 View 相关的方法：getChildMeasureSpec ， measureChild，measureChildWithMargins，measureChildren 。

### MeasureSpec

一个从上层视图角度考虑的，对当前 View 的尺寸限制。有两个数据，一个 mode ， 一个 size。

整型（32位）将 size 和 mode 打包成一个 int 型，其中高两位是 mode(-1 代表的是EXACTLY，-2 是AT_MOST)，后面 30 位存的 size。

一个 View 的 MeasureSpec 是由上层 View 的 MeasureSpec 加上自身的 LayoutParams 来得到的 mode，由具体业务逻辑（比如当前 ViewGroup 剩余的空间）来得到 size。参考 getChildMeasureSpec 方法。

`MeasureSpec.makeMeasureSpec()` 制作一个 MeasureSpec 。

MeasureSpec 一共有三种 mode

- EXACTLY 当前 View 应直接使用上层 View 给定的限制尺寸
- AT_MOST 当前 View 可以是 上层 View 给定限制尺寸 以内的任意尺寸
- UPSPECIFIED 上层 View 对当前 View 没有任何限制，当前 View 可以使用任意尺寸

### LayoutParams

当前 View 给上层 ViewGroup 提供的布局需求。

在 xml 布局中使用的以 "layout_" 开头的属性都是布局属性。

在View中有一个 mLayoutParams 的变量用来保存这个View的所有布局属性。

ViewGroup 中有两个内部类 LayoutParams 和 MarginLayoutParams，它们只有最基础的功能。

LayoutParams 只有 width / height 两个功能属性。MarginLayoutParams 是 LayoutParams 的子类，是添加了 Margin 相关属性的 LayoutParams。
如果需要其他的功能，需要继承 LayoutParams

`generateLayoutParams (AttributeSet attrs)` 方法作用是将 xml 布局中的 AttributeSet 参数，转化成 LayoutParams。
自定义控件时，自定义了 LayoutParams 属性时，需要 override 这几方法。

### getChildMeasureSpec

ViewGroup 中的 getChildMeasureSpec：（measureChild 和 measureChildWithMargins 都会调用这个方法）
这个方法是按照 child 在这个维度上**独享**上层 ViewGroup 的逻辑来计算的。如果你的 ViewGroup 并不是这种逻辑，比如一个一个排列的摆放逻辑，那么定义一个变量记录在当前 child 时，上层 ViewGroup 还剩多少尺寸。

```Java
// spec：上层 ViewGroup 的 MeasureSpec
// padding：上层 ViewGroup 的 Padding + 当前 View 的 Margin
// childDimension：当前 View 的 LayoutParams 的 lp.width 或者 lp.height（ 可以是wrap_content、match_parent、一个精确值)
public static int getChildMeasureSpec(int spec, int padding, int childDimension) {
    int specMode = MeasureSpec.getMode(spec);
    int specSize = MeasureSpec.getSize(spec);
    int size = Math.max(0, specSize - padding);
    int resultSize = 0;
    int resultMode = 0;
    switch (specMode) {
        case MeasureSpec.EXACTLY:
            if (childDimension >= 0) {
                resultSize = childDimension;
                resultMode = MeasureSpec.EXACTLY;
            }
            else if (childDimension == LayoutParams.MATCH_PARENT) {
                resultSize = size;  
                resultMode = MeasureSpec.EXACTLY; 
            }
            else if (childDimension == LayoutParams.WRAP_CONTENT) {
                resultSize = size;
                resultMode = MeasureSpec.AT_MOST;
            }
            break;
        case MeasureSpec.AT_MOST:
            if (childDimension >= 0) {
                resultSize = childDimension; 
                resultMode = MeasureSpec.EXACTLY;  
            }
            else if (childDimension == LayoutParams.MATCH_PARENT) {
                resultSize = size;  
                resultMode = MeasureSpec.AT_MOST;  
            }
            else if (childDimension == LayoutParams.WRAP_CONTENT) {
                resultSize = size;  
                resultMode = MeasureSpec.AT_MOST;  
            }
            break;
        case MeasureSpec.UNSPECIFIED:
            if (childDimension >= 0) {
                resultSize = childDimension;  
                resultMode = MeasureSpec.EXACTLY; 
            }
            else if (childDimension == LayoutParams.MATCH_PARENT) {
                resultSize = 0;  
                resultMode = MeasureSpec.UNSPECIFIED;  
            }
            else if (childDimension == LayoutParams.WRAP_CONTENT) {
                resultSize = 0;  
                resultMode = MeasureSpec.UNSPECIFIED; 
            }
            break;
    }
    return MeasureSpec.makeMeasureSpec(resultSize, resultMode);
}
```

###  measureChild / measureChildWithMargins  / measureChildren 

measureChild 是对 child 的宽高调用 getChildMeasureSpec，然后调用 child.measure。

measureChildWithMargins 与 measureChild 唯一的区别是调用 getChildMeasureSpec 时，第二个参数加上了 child 的 lp.margin。

measureChildren 是遍历当前 ViewGroup 所有 child，并调用 measureChild。


## Layout

摆放 View 的位置

与 Measure 过程不同的是，layout 调用时，`layout` 中先 `setFrame` 确定当前 View 的位置，再 `onLayout` 遍历下层 View 并确定位置。

### `layout`

layout 确定 View 自身的位置。

View 中的 `layout()` 的参数是上一步测量后保存在上层 View 的 **当前 View 的尺寸**对应的位置，方法主要功能是：
先调用 `setFrame()` 设置当前 View 位置，

`setFrame()` 返回一个 boolean，代表位置是否变化，如果有变化，则调用`onLayout()` ，此时如果有 LayoutChangeListener，依次调用其 onLayoutChange 方法。

View 中的 `setFrame()` 主要功能是：将新旧位置进行对比，只要不完全相同，那么 changed 变量设置为 true，保存新的位置，保存局部渲染可能使用的位置信息。调用 `onSizeChanged()` 方法。同时如果 View 处于可见状态，那么调用 invalidate 来重新绘制，最后返回 changed 的值。

ViewGroup 中的 `layout()` 主要功能是：处理 ViewGroup 增加和删除下层 View 的 LayoutTransition 动画效果，如果未添加动画，或者动画此刻并未运行，那么调用 `super.layout(l, t, r, b)`，也就是 View 的 layout，否则等待动画完成时后调用 `requestLayout()`。

View 中的 `layout()` 是可以被覆写的。
ViewGroup 中的 `layout()` 是 final 的，不能被覆写。

在完成 layout 之后，可以使用 getWidth 和 getHeight，获得正常尺寸，这个尺寸是通过计算摆放完的控件坐标得来。`getWidth = right - left`

### `onLayout`

onLayout 调度下层 View 确定位置。

View 不会再有下层 View，所以 View 的 onLayout 是空实现，ViewGroup 中的  onLayout 是抽象方法。所以 onLayout 肯定是 有具体的功能的 ViewGroup 子类实现。通常需要做这些事：

根据这个 ViewGroup 子类的摆放逻辑，onMeasure 过程中得到的下层 View 的相关尺寸，LayoutParams 的 margin，得出每个下层 View 应处的左上右下位置（可能已经在 onMeasure 时已经一起测量出来，并且保存在某个变量中），最终调用每个下层 View 的 `layout()`，形成递归。


## draw(canvas)

draw 方法主要功能是：按顺序调用当前 View 各个「景深」层面的绘制。

View 中的`draw` 方法不是 final 的，可以被覆写。ViewGroup 没有`draw()`实现。

View 中的 `draw()` 的过程，源码注释已经很清楚了：

```
/*
  * Draw traversal performs several drawing steps which must be executed
  * in the appropriate order:
  *
  * 1. Draw the background
 skip step 2 & 5 if possible (common case)

  * 2. If necessary, save the canvas' layers to prepare for fading
  * 3. Draw view's content
  * 4. Draw children
  * 5. If necessary, draw the fading edges and restore layers
  * 6. Draw decorations (scrollbars for instance)
  */
```
主要就是调用了下面几个方法：（对应上面注释的序号）
1. `drawBackground()` 背景(不能覆写)
3. `onDraw()` 当前 View
4. `dispatchDraw()` 下层 View
6. `onDrawForeground()` 滑动边缘渐变提示和滚动条，前景。如果覆写，需要 `minSdk>=23`

> 不同于 `measure` 和 `layout` ，遍历下层 View 这个步骤，不是在 `onDraw` 中，而是在 `draw` 中。并且有专门的 `dispatchDraw ` 方法遍历下层 View 。

### onDraw

实现当前 View 自身内容的绘制（包括 padding 的处理）。

View 和 ViewGroup 的 `onDraw(canvas)` 都是空实现。
 
ViewGroup 的 `draw()` 默认不会调用 `onDraw()` 方法。因为正常来说，ViewGroup 是一个 View 容器，自身不会有具体画面。

如果需要回调 onDraw() 方法，在构造函数中调用 `setWillNotDraw(false)` 即可。（但是，如果你继承的是比如 ScrollView 这种 ViewGroup ，它已经调用过 `setWillNotDraw(false)` 了）

在 `draw()` 过程中，某些情况下，比如只是前景状态改变，系统会做相应优化，跳过 `onDraw()` 。

### dispatchDraw

View 的 `dispatchDraw()` 方法是一个空方法

ViewGroup 的 `dispatchDraw()` 主要功能就是遍历下层 View，计算下层 View 的 cavas 剪切区（剪切区的大小正是由 layout 过程决定的，位置取决于滚动值以及当前的动画等），并调用它们的 `draw(canvas)` 方法。

这个实现基本能满足大部分需求，如果需要自定义下层 View 的绘制，则需要覆写这个方法。通常会在这个自定义的方法中，根据自定义的逻辑，在合适的位置调用默认过程 `super.dispatchDraw(canvas);` ，省时省力。


## `invalidate()`

`invalidate()` 重绘这个 View，需要注意的是在开启了硬件加速时，可能会跳过 `onDraw()`

`invadite()` 必须在主线程中调用。

`postInvalidate()` 内部是由 Handler 的消息机制实现的，所以在任何线程都可以调用，但实时性没有 invadite() 强。所以保险起见，一般是使用 postInvalidate() 来刷新界面。

