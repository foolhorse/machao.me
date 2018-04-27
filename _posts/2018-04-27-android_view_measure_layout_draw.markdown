---
layout: post
title: "Android View 测量布局绘制过程"
date: 2018-04-27 20:02:00 +0800
tags: develop android measure layout draw
published: true
---
# Android View 测量布局绘制过程

## 开始

每个 Activity 会创建一个 PhoneWindow 对象，是 Activity 和整个 View 系统交互的接口。

每个 Window 都通过一个 ViewRootImpl 与一个 VIew 关联，对于 Activity来说，ViewRootImpl 是连接 WindowManager 和 DecorView 的纽带。

绘制的入口是由 ViewRootImpl 的 performTraversals 方法去依次调用 DecorView 的 measure，layout，draw 方法。

在调用 DecorView 的 measure 时，会传入 MeasureSpec 参数。这个参数是由屏幕宽高，和WindowManager.LayoutParams 得来的。

FYI：ViewGroup 是一个抽象类，所以不能直接 new 对象，所以在 xml 布局文件中不能直接使用 ViewGroup。

把大象装冰箱，总共分三步走。

## Measure

View 的 measure 是 final，所以 View 的子类（比如 ViewGroup / 自定义控件）是不能 override 这个方法的。所以 ViewGroup 没有实现 measure 方法，也就是说，它使用的是父类 View 的 measure 。

View 的 measure 主要作用就是调用自己的 onMeasure。另外就是维护一些 View 本身的状态变量。

一个 ViewGroup 的 measure 过程，主要发生在 onMeasure 的实现中，通常会遍历所有下层 View，遍历过程中会调用下层 View 的measure，形成递归。最后把所有下层 VIew 的尺寸计算完成并保存，然后得出当前 ViewGroup 自身的尺寸并保存。

### onMeasure

View 的子类 / 自定义控件实现 onMeasure 方法，设置自身的测量过程。

抽象类 ViewGroup 中没有 onMeasure 的实现，所以默认的 onMeasure 是 View 的 onMeasure 。
View 的 onMeasure 的功能是测量自身的尺寸，没有下层 View 相关的逻辑。
也就是说，ViewGroup 的 onMeasure 虽然最终也是要测量出自身的尺寸，但是需要 ViewGroup 实现类自己调度所有下层 View 的尺寸测量，才能知道 ViewGroup 的尺寸。

#### View.onMeasure 

View 中默认 onMeasure 方法，会测量自身的尺寸，并调用自身的 setMeasuredDimension 保存尺寸。（因为不是 ViewGroup ，所以只测量自身，不涉及下层 View ）

其中调用 getDefaultSize 时，因为 View 本身没有业务逻辑，所以会将 `WRAP_CONTENT` 的情况像 `MATCH_PARENTS` 一样填满父控件，所以自定义 View 如果需要支持 `WRAP_CONTENT` ，需要重写 onMeasure方法。
```
protected void onMeasure( int widthMeasureSpec, int heightMeasureSpec) {
    setMeasuredDimension( getDefaultSize(getSuggestedMinimumWidth(), widthMeasureSpec),
            getDefaultSize(getSuggestedMinimumHeight(), heightMeasureSpec));
}

protected int getSuggestedMinimumWidth () {
    return (mBackground == null) ? mMinWidth : max(mMinWidth , mBackground.getMinimumWidth());
}

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

#### ViewGroup.onMeasure 

ViewGroup 子类的 onMeasure 的实现方式，基本上，分三步🚶🚶🚶。

1. 遍历所有下层 View，使用当前 ViewGroup 的 MeasureSpec 和下层 View 的 LayoutParams 结合自身业务逻辑推导出每个下层 View 的 MeasureSpec。（计算过程通常是使用 measureChild 调用 getChildMeasureSpec 方法）
2. measureChild 会调用此 child 的 measure，形成递归，递归会一直到最下层 View 的 measure ，传入上一步的得到的此下层 View 的 MeasureSpec，继而调用 onMeasure，此处通过这个下层 View 自身的业务逻辑得出一个需要的尺寸，同时结合 MeasureSpec 限制，推导出自身尺寸并保存（ setMeasureSize ）
3. 递归最终回到上层 ViewGroup 里，此时所有下层 View 都计算好了尺寸并且保存了（setMeasureSize），上层的 ViewGroup（如 FrameLayout ）按照控件自身的逻辑，结合子 View 的尺寸，最终计算并保存自身的尺寸

ViewGroup 提供了几个通用的测量下层 View 相关的方法：getChildMeasureSpec ， measureChild，measureChildWithMargins，measureChildren 。


根据所有下层 View 的尺寸，或者自定义的业务逻辑相关属性，计算并保存当前 ViewGroup 的期望尺寸 setMeasuredDimension。此时，可以使用 View 的 resoveSize 方法帮助计算。
`resolveSize()` 传入当前 View 的需要的尺寸和上层 View 的限制，得到一个符合限制的尺寸。（当然，如果想用自定义的方式来满足上层 View 的限制也行。

在完成 measure 之后，可以使用 getMeasureWidth() 和 getMeasureHeight() 获得经过 measure 之后的控件尺寸。

### MeasureSpec

一个从上层视图角度考虑的尺寸限制。有两个数据，一个 mode ， 一个 size。

整型（32位）将 size 和 mode 打包成一个 int 型，其中高两位是 mode(-1 代表的是EXACTLY，-2 是AT_MOST)，后面 30 位存的 size。

一个 View 的 MeasureSpec 是由上层 View 的 MeasureSpec 加上自身的 LayoutParams 来得到的mode，由具体业务逻辑（比如当前 ViewGroup 剩余的空间）来得到 size。参考 getChildMeasureSpec 方法。

`MeasureSpec.makeMeasureSpec()` 制作一个 MeasureSpec

MeasureSpec 一共有三种 mode

- EXACTLY 当前 View 应直接使用上层 View 给定的限制尺寸
- AT_MOST 当前 View 可以是 上层 View 给定限制尺寸 以内的任意尺寸
- UPSPECIFIED 上层 View 对当前 View 没有任何限制，当前 View 可以使用任意尺寸

### LayoutParams

View 给上层 ViewGroup 提供的布局需求。

在 xml 布局中使用的以 "layout_" 开头的属性都是布局属性。

在View中有一个 mLayoutParams 的变量用来保存这个View的所有布局属性。

ViewGroup 中有两个内部类 LayoutParams 和 MarginLayoutParams，它们只有最基础的功能。
LayoutParams 只有 width / height 两个功能属性。
MarginLayoutParams 是 LayoutParams 的子类，是添加了 Margin 相关属性的 LayoutParams。
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

###  measureChild，measureChildWithMargins，measureChildren 。

measureChild 是对 child 的宽高调用 getChildMeasureSpec，然后调用 child.measure。
measureChildWithMargins 与 measureChild 唯一的区别是调用 getChildMeasureSpec 时，第二个参数加上了 child 的 lp.margin。
measureChildren 是遍历当前 ViewGroup 所有 child，并调用 measureChild。


## Layout

摆放下层 View 的位置

ViewGroup 中的 `layout()`主要功能是：处理 ViewGroup 增加和删除下层 View 的 LayoutTransition 动画效果，如果未添加动画，或者动画此刻并未运行，那么调用 `super.layout(l, t, r, b)`，否则等待动画完成时后调用 `requestLayout()`。

View 中的 `layout()` 的参数是上一步测量后保存在上层 View 的 **当前 View 的尺寸位置**，方法主要功能是：先调用 `setFrame()` 设置当前 View 位置，`setFrame()` 返回一个 boolean，代表位置是否变化，如果有变化，则调用`onLayout()` ，如果有LayoutChangeListener，依次调用其 onLayoutChange 方法。

View 中的 `setFrame()` 主要功能是：将新旧位置进行对比，只要不完全相同，那么 changed 变量设置为 true，保存新的位置，保存局部渲染可能使用的位置信息。调用 `onSizeChanged()` 方法。同时如果 View 处于可见状态，那么调用 invalidate，最后返回 changed 的值。

View 中的 `layout()` 是可以被覆写的。
ViewGroup 中的 `layout()` 是 final 的，不能被覆写。

在完成 layout 之后，可以使用 getWidth 和 getHeight，获得正常尺寸，这个尺寸是通过计算摆放完的控件坐标得来。`getWidth = right - left`

### onLayout

不同于 onMeasure， View 中的 onLayout 是空实现，ViewGroup 中的  onLayout 是抽象方法。所以 onLayout 肯定是 有具体的功能的 ViewGroup 子类实现。通常需要做这些事：

根据这个 ViewGroup 子类的摆放逻辑，加上上一步 onMeasure 得到的下层 View 的相关尺寸（宽高 / padding / margin），得出每个下层 View 应处的位置（可能已经在 onMeasure 时已经一起测量出来，并且保存在某个变量中），最终调用每个下层 View 的 `layout()`


## draw(canvas)

ViewGroup 没有`draw()`实现。
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
1. drawBackground() 背景(不能覆写)
3. onDraw() 当前 View
4. dispatchDraw() 下层 View
6. onDrawForeground() 滑动边缘渐变提示和滚动条，前景。如果覆写，需要 minSdk>=23

不同于 `measure` 和 `layout` ，View 中的`draw` 方法不是 final 的，可以被覆写。

### onDraw

View 的 `onDraw(canvas)` 是空实现，ViewGroup 也没有实现。
 
ViewGroup 不会回调 `onDraw()` 方法。如果需要回调 onDraw() 方法，在构造行数中调用 `setWillNotDraw(false)` 以进行完整的 draw 调用。（但是，如果你继承的是比如 ScrollView 这种 ViewGroup ，它已经调用过 `setWillNotDraw(false)` 了）
在 draw 过程中，某些情况下，比如只是前景状态改变，系统会做相应优化，跳过 `onDraw()` 。

### dispatchDraw

View 的 `dispatchDraw()` 方法是一个空方法

ViewGroup 的 `dispatchDraw()`主要功能就是遍历下层 View，计算下层 View 的 cavas 剪切区（剪切区的大小正是由layout过程决定的，位置取决于滚动值以及当前的动画等），并调用它们的 `draw(canvas)` 方法。

这个实现基本能满足大部分需求，如果需要自定义下层 View 的绘制，则需要覆写这个方法，通常会在自定义的部分的中间部分，根据自定义的逻辑去调用 `super.dispatchDraw(canvas);` 插入默认过程，省时省力。


## invalidate()

invalidate() 重绘这个 View，需要注意的是在开启了硬件加速时，可能会跳过 onDraw()

invadite() 必须在主线程中调用
postInvalidate() 内部是由Handler的消息机制实现的，所以在任何线程都可以调用，但实时性没有invadite() 强。
所以一般为了保险起见，一般是使用 postInvalidate() 来刷新界面。

