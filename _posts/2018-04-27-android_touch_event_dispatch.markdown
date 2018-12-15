---
layout: post
title: "Android TouchEvent 触摸事件传递"
date: 2018-04-27 20:16:00 +0800
tags: develop android touch event
published: true
---
# Android TouchEvent 触摸事件传递

## Activity

事件由 Activity 的 `dispatchTouchEvent()` 开始，将事件传递给当前 Activity 的根ViewGroup：mDecorView，事件开始自上而下进行传递，直至被消费。

Activity 里 `dispatchTouchEvent(MotionEvent ev)` 被调用，
会调用 `getWindow().superDispatchTouchEvent(ev)`，
PhoneWindow 中的 `superDispatchTouchEvent(ev)` 调用的是 DecorView 的 `superDispatchTouchEvent(event)` 
再调用的是 `super.dispatchTouchEvent(event);`DecorView 的父类是 FrameLayout，FrameLayout 没有重写 `dispatchTouchEvent` 方法，所以事件开始交由 ViewGroup 的 `dispatchTouchEvent` 开始分发

如果 `getWindow().superDispatchTouchEvent(ev)` 返回 false，也就意味着整个分发过程没有人消费，则会直接调用 Activity 的 `onTouchEvent(ev)`

## ViewGroup 中的 dispatchTouchEvent

这里的代码分析使用的是 Android 1.6 版本，之后的版本有不少改动，完善了多指触控等功能，但是行为逻辑都是一样的。
<https://github.com/aosp-mirror/platform_frameworks_base/blob/donut-release/core/java/android/view/ViewGroup.java>

这里调度事件在 View 层级中的传递。

ViewGroup 的 onInterceptTouchEvent 直接返回了 false，即默认是不拦截事件的。这个 onInterceptTouchEvent 是自定义 View 时，是否要在当前 View 对当前一串滑动操作进行处理。通常就写在这里。
可以通过 `requestDisallowInterceptTouchEvent(boolean disallowIntercept)` 设置是否拦截事件。
通常处理上下层滑动冲突时，下层 View 想要处理滑动事件，就会根据滑动的情况判断来调用 上层 ViewGroup 的 requestDisallowInterceptTouchEvent 来获得当前滑动。如果是上层 ViewGroup 想要处理滑动事件，则是使用 onInterceptTouchEvent 。
 
这段伪代码就把传递过程解释了大部分，可以多看几眼。
```
if (action == MotionEvent.ACTION_DOWN) {
    // disallowIntercept 为 true （下层 View 不允许在这里 Intercept）
    //  或者 onInterceptTouchEvent 返回 false 时。（此处调用了onInterceptTouchEvent）
    if (disallowIntercept || !onInterceptTouchEvent(ev)) {
        // 向下层传递。循环下层 View ，找到触摸点**击中**的下层 View 
        for(){
            if (frame.contains(scrolledXInt, scrolledYInt)) {
                // 如果这个下层 View 的 dispatchTouchEvent 返回 true，则把它赋值给 mMotionTarget，同时这个 ViewGroup 中的 dispatchTouchEvent 返回true。（此处调用了下层 View 的dispatchTouchEvent）
                if (child.dispatchTouchEvent(ev)) {
                    mMotionTarget = child;
                    return true;
                }
            }
        }
    }
}
// 如果 mMotionTarget 为空，这里有两种情况，一种是中断，一种是没找到合适的下层 View
// 那么调用  super.dispatchTouchEvent(ev)，也就是 View 的 dispatchTouchEvent(ev)，也就是由 ViewGroup 自身来处理事件。
final View target = mMotionTarget;
if (target == null) {
    return super.dispatchTouchEvent(ev);
} 
// 如果 onInterceptTouchEvent 返回了 true
if (!disallowIntercept && onInterceptTouchEvent(ev)) {
           // 那么给 target 发去一个 CANCEL 的事件。这里调用 target.dispatchTouchEvent(ev) CANCEL 事件。
            ev.setAction(MotionEvent.ACTION_CANCEL);
            if (!target.dispatchTouchEvent(ev)) {
             
            }
            // clear the target
            mMotionTarget = null;
            // 不需要再 `super.dispatchTouchEvent(ev)`，因为接下来的事件肯定是当前 ViewGroup 消费，所以这里返回 true，让上一层的 ViewGroup 会负责后续事件分发过来。
            return true;
}
if (isUpOrCancel) {
    mMotionTarget = null;
}
// 将事件转换成 目标 View 的坐标后 ，调用 target.dispatchTouchEvent(ev); 并返回
return target.dispatchTouchEvent(ev);
```

首先在 ACTION_DOWN 事件 时，先 onInterceptTouchEvent ，不中断的话，迭代下层 view 寻找 target 。target 的条件是 点击区域在这个 child view 的范围内，同时这个 child 的 dispatchTouchEvent(ev) 返回 true。注意这里形成了上下层 view 的递归，如果满足条件，则调用这个 View 的 dispatchTouchEvent，如果 dispatchTouchEvent 返回 true，说明这个下层 View 想要处理这个时间，则设置这个 child 为 target，并且当前 ViewGroup 的 dispatchTouchEvent 返回 true 。如果迭代完所有下层 View 之后还没找到 target，则调用 `super.dispatchTouchEvent(ev);` 也就是 ViewGroup 自身处理事件。如果这里也返回 false ，直到传递到最上层 ViewGroup 也仍然没有被消费的话，最后会回到 Activity 的onTouchEvent。

接下来会在这里收到 `ACTION_DOWN` 之后的 `ACTION_MOVE` ，这里有一个在处理 `ACTION_DOWN` 事件时是否找到了 target 的判断，如果没有，则直接调用自己的 `return super.dispatchTouchEvent(ev);` 也就是调用了 View 的 `dispatchTouchEvent`，并且 return 。

如果有 target ，则先 onInterceptTouchEvent ，不中断的话就 `return target.dispatchTouchEvent(ev);`，中断的话则 ` ev.setAction(MotionEvent.ACTION_CANCEL); ` ，把这个取消事件给 target` target.dispatchTouchEvent(ev))`，当前 ViewGroup 的 dispatchTouchEvent 返回 true 。

根据上面的流程可以看出，在处理完 ACTION_DOWN 事件时，有一个上下层的递归，这个递归实际上就是事件在 View 层级中由上而下的传递，在这个过程中设置 target。当确定了 target 是否存在后，后面的  ACTION_MOVE 等事件在 View 层级中的流向就时确定的了。


## View 中的 dispatchTouchEvent

这里决定事件在 View 内部由哪个方法处理。

- dispatchTouchEvent(MotionEvent event)
如果有 OnTouchListener ，同时当前 View 处于可用状态`(mViewFlags & ENABLED_MASK) == ENABLED`的话，就执行 OnTouchListener 的 onTouch，如果`mOnTouchListener.onTouch(this, event)==true` ，View 的 dispatchTouchEvent 在这里直接返回，返回值是 true。
没有 OnTouchListener 的话就执行 `onTouchEvent(MotionEvent event)`

```
    public boolean dispatchTouchEvent(MotionEvent event) {
        if (mOnTouchListener != null && (mViewFlags & ENABLED_MASK) == ENABLED && mOnTouchListener.onTouch(this, event)) {
            return true;
        }
        return onTouchEvent(event);
    }
```

- OnTouchListener 的 `onTouch()`
用户使用setOnTouchListener设置的。
如果它的 `onTouch()` 返回 true，则 View 本身的`onTouchEvent()`不会被调用。如果返回 false，则 View 本身的`onTouchEvent()`会被调用。

所以，OnTouchListener 的 `onTouch()` 优先级比 View 本身的`onTouchEvent()` 要高。

而用户通过 setOnClickListener 设置的 OnClickListener 中的 onClick，是在 View 本身的`onTouchEvent()`中判断执行的，因此，用户设置的 onTouch 事件会优先于 onClick 事件。

- `onTouchEvent(MotionEvent event)`

<https://github.com/aosp-mirror/platform_frameworks_base/blob/donut-release/core/java/android/view/View.java#L4097>

在 View 类中，会通过 MotionEvent 的事件类型（ ACTION_UP ）和各项条件判断去调用 `performClick()` 继而调用 `mOnClickListener.onClick(this);`

View 的 onTouchEvent 默认返回 true。也就是如果事件流到 View 的 onTouchEvent 中，默认会消费这个事件。
如果当前View 是不可点击的（ clickable 和 longClickable 都是 false，longClickable 默认是 false，clickable 不同控件的值不同），那么 View 的 onTouchEvent 默认返回 false。


## framework 中包含的工具

ViewConfigration 中：
- Slop
- ScaleSlop

处理触摸事件的相关工具：
- GestureDetector
- ScaleGestureDetector
- VelocityTracker

控制某位置的触摸事件流向：
- TouchDelegate

处理滚动的计算：
- Scroller 


## 参考

<https://github.com/devunwired/custom-touch-examples>


