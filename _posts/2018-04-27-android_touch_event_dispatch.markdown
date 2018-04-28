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

Activity 里 dispatchTouchEvent(MotionEvent ev) 被调用，
会调用 getWindow().superDispatchTouchEvent(ev)
PhoneWindow 中的 superDispatchTouchEvent(ev) 调用的是 DecorView 的 superDispatchTouchEvent(event) 
再调用的是 `super.dispatchTouchEvent(event);`DecorView 的父类是 FrameLayout，FrameLayout 没有重写 dispatchTouchEvent 方法，所以事件开始交由 ViewGroup 的 dispatchTouchEvent 开始分发

如果 `getWindow().superDispatchTouchEvent(ev)` 返回 false，则会直接调用 Activity的 `onTouchEvent(ev)`

## ViewGroup 中的 dispatchTouchEvent

这里调度事件在 View 层级中的传递。

ViewGroup 的 onInterceptTouchEvent 直接返回了false，即默认是不拦截事件的。
可以通过 requestDisallowInterceptTouchEvent(boolean disallowIntercept) 设置是否拦截事件。
 
这段伪代码就把传递过程解释了大部分，可以多看几眼。
```
if (action == MotionEvent.ACTION_DOWN) {
    //  onInterceptTouchEvent 返回 false 时。（此处调用了onInterceptTouchEvent）
    if (disallowIntercept || !onInterceptTouchEvent(ev)) {
        //循环下层 View ，找到触摸点击中的下层View 
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
// 如果 mMotionTarget 为空，则调用  super.dispatchTouchEvent(ev)，也就是 View 的 dispatchTouchEvent(ev)，也就是由 ViewGroup 自身来处理事件。
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
            // 不需要再 dispatch 这个事件给自身，因为在调用 onInterceptTouchEvent 时 自身应该已经使用了,   
            // 为了让后续事件过来，所以这里返回 true。
            return true;
}
if (isUpOrCancel) {
    mMotionTarget = null;
}
// 将事件转换成 目标 View 的坐标后 ，调用 target.dispatchTouchEvent(ev);
return target.dispatchTouchEvent(ev);
```

首先在 ACTION_DOWN 事件 时，先 onInterceptTouchEvent ，不中断的话，迭代下层 view 寻找 target 。target 的条件是 点击区域在这个 child view 的范围内，同时这个 child 的 dispatchTouchEvent(ev) 返回 true。注意这里形成了上下层 view 的递归，如果满足条件，则调用这个 View 的 dispatchTouchEvent，如果 dispatchTouchEvent 返回 true，说明这个下层 View 想要处理这个时间，则设置这个 child 为 target，并且当前 ViewGroup 的 dispatchTouchEvent 返回 true 。如果迭代完所有下层 View 之后还没找到 target，则调用 `super.dispatchTouchEvent(ev);` 也就是 ViewGroup 自身处理事件。如果这里也返回 false ，直到传递到最上层 ViewGroup 也仍然没有被消费的话，最后会回到 Activity 的onTouchEvent。

接下来会在这里收到 ACTION_DOWN 之后的 ACTION_MOVE ，这里有一个在处理 ACTION_DOWN 事件时是否找到了 target 的判断，如果没有，则直接调用自己的 `return super.dispatchTouchEvent(ev);` 也就是调用了 View 的 `dispatchTouchEvent`，并且 return 。

如果有 target ，则先 onInterceptTouchEvent ，不中断的话就 `return target.dispatchTouchEvent(ev);`，中断的话则 ` ev.setAction(MotionEvent.ACTION_CANCEL); ` ，把这个取消事件给 target` target.dispatchTouchEvent(ev))`，当前 ViewGroup 的 dispatchTouchEvent 返回 true 。

根据上面的流程可以看出，在处理完 ACTION_DOWN 事件时，有一个上下层的递归，这个递归实际上就是事件在 View 层级中由上而下的传递，在这个过程中设置 target。当确定了 target 是否存在后，后面的  ACTION_MOVE 等事件在 View 层级中的流向就时确定的了。


## View 中的 dispatchTouchEvent

这里决定事件在 View 内部由哪个方法处理。

- dispatchTouchEvent(MotionEvent event)
如果有 OnTouchListener 就执行 OnTouchListener( 同时(mViewFlags & ENABLED_MASK) == ENABLED和mOnTouchListener.onTouch(this, event)==true 的条件下)，并且返回true（这个返回true没有意义，因为前一步  mOnTouchListener.onTouch(this, event)时就会返回一只 boolean了 ）
没有的话就执行 onTouchEvent(MotionEvent event)

```
    public boolean dispatchTouchEvent(MotionEvent event) {
        if (mOnTouchListener != null && (mViewFlags & ENABLED_MASK) == ENABLED &&
                mOnTouchListener.onTouch(this, event)) {
            return true;
        }
        return onTouchEvent(event);
    }
```

- OnTouchListener的onTouch()
用户使用setOnTouchListener设置的

- onTouchEvent(MotionEvent event)
在 View 类中，会通过 MotionEvent 的事件类型（ ACTION_UP ）和各项条件判断去调用 performClick() 继而调用 mOnClickListener.onClick(this);
如果 onTouchEvent(MotionEvent event)返回 true 则消费了这个事件，不再在 View 树里继续传递。如果返回false 则
因此，onTouch 事件会优先于onClick 事件。


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

