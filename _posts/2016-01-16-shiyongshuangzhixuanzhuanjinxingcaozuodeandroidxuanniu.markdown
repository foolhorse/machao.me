---
title: 使用双指旋转进行操作的Android旋钮
date:   2015-12-01 00:00:00 +0800
layout: post
tags: Android
---
 
###使用双指旋转进行操作的Android旋钮


我们这个KnobView继承自ImageView，旋转的原理就是使用matrix实现图片旋转。所以scale type是matrix，还有一个mMatrix的field。

首先，override一下onSizeChanged，作用是初始化一下matrix，另外计算一下旋转的圆心：

{% highlight java %}
int translateX = (w - getDrawable().getIntrinsicWidth()) / 2;
int translateY = (h - getDrawable().getIntrinsicHeight()) / 2;
mMatrix.setTranslate(translateX, translateY);
setImageMatrix(mMatrix);

mPivotX = w / 2;
mPivotY = h / 2;
{% endhighlight %}

然后就是override处理触摸事件的onTouchEvent 了， 对于判断多点触摸，关键代码就一句：通过event.getPointerCount()获取现在是几根手机在摸你的手机，如果是两根的话就进入旋转的逻辑。
{% highlight java %}
if (event.getPointerCount() == 2) {
return rotate(event);
} else {
return super.onTouchEvent(event);
}
{% endhighlight %}

旋转的处理部分，先拿到两个触摸点的xy坐标然后计算角度，注意一下对于多点触摸的事件最好使用event.getActionMasked()来获取。然后就是通过角度计算这个按钮图片应该旋转多少，通过mMatrix.postRotate去执行旋转就可以了。这里有个坑是前一篇文章提到的三角函数的问题，我开始的时候用atan去计算，但是tan这个函数吧，不是线性的。。。导致越过正90度和负90度时需要手动处理一下。
贴代码：
{% highlight java %}
private boolean rotate(MotionEvent event) {
float deltaX = event.getX(0) - event.getX(1);
float deltaY = event.getY(0) - event.getY(1);
double radians = Math.atan(deltaY / deltaX);
int degrees = (int) (radians * 180 / Math.PI);

switch (event.getActionMasked()) {
case MotionEvent.ACTION_DOWN:
case MotionEvent.ACTION_POINTER_DOWN:
case MotionEvent.ACTION_POINTER_UP:
mLastAngle = degrees;
break;
case MotionEvent.ACTION_MOVE:
Log.d("MARR", "degrees:" + degrees + "mLastAngle" + mLastAngle);
// mMatrix.postRotate(degrees - mLastAngle, mPivotX, mPivotY);

if ((degrees - mLastAngle) > 45) {
mMatrix.postRotate(-5, mPivotX, mPivotY);
} else if ((degrees - mLastAngle) < -45) {
mMatrix.postRotate(5, mPivotX, mPivotY);
} else {
mMatrix.postRotate(degrees - mLastAngle, mPivotX, mPivotY);
}

setImageMatrix(mMatrix);
mLastAngle = degrees;
break;
}
return true;
}
{% endhighlight %}



