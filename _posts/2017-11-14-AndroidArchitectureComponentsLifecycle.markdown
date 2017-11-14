---
layout: post
title: "Android Architecture Components Lifecycle"
date: 2017-11-14 23:50:00 +0800
tags: develop android
published: true
---
# Android Architecture Components Lifecycle

Lifecycle 是一个持有组件（比如 activity 或者 fragment）生命周期状态信息的类，并且允许其它对象观察这个状态。

Lifecycle 主要使用 Event 和 State 这两个枚举来跟踪相关组件的生命周期状态。

LifecycleOwner：代表具有生命周期的对象，比如 Activity / Fragment

LifecycleObserver：观测 LifecycleOwner ，并在其生命周期变化时，收到通知。

## Event

由 framework 和 Lifecycle 类发出的生命周期事件。这些事件对应 Activity / Fragment 中的回调事件。

> Lifecycle.Event.ON_ANY：An Event constant that can be used to match all events
> Lifecycle.Event.ON_CREATE：Constant for onCreate event of the LifecycleOwner
> Lifecycle.Event.ON_DESTROY：Constant for onDestroy event of the LifecycleOwner
> Lifecycle.Event.ON_PAUSE：Constant for onPause event of the LifecycleOwner
> Lifecycle.Event.ON_RESUME：Constant for onResume event of the LifecycleOwner
> Lifecycle.Event.ON_START：Constant for onStart event of the LifecycleOwner
> Lifecycle.Event.ON_STOP：Constant for onStop event of the LifecycleOwner

## State

Lifecycle 对象获取到的组件当前的状态。

> Lifecycle.State.CREATED：Created state for a LifecycleOwner. 
> Lifecycle.State.DESTROYED：Destroyed state for a LifecycleOwner. 
> Lifecycle.State.INITIALIZED：Initialized state for a LifecycleOwner. 
> Lifecycle.State.RESUMED：Resumed state for a LifecycleOwner. 
> Lifecycle.State.STARTED：Started state for a LifecycleOwner. 

## LifecycleOwner 

LifecycleOwner 是一个接口，只有 getLifecycle() 一个方法，实现类具有生命周期。

可以使用 LifecycleObserver 来监听 LifecycleOwner 的 Lifecycle 的变化。

Arch v1.0.0 版本之后，Support Library 26.1.0 版本以上的 Activity / Fragment 已经默认实现了 LifecycleOwner 接口。

```
class MyActivity extends AppCompatActivity {
    private MyLocationListener myLocationListener;

    public void onCreate(...) {
        myLocationListener = new MyLocationListener(this, getLifecycle(), location -> {
            // update UI
        });
        Util.checkUserStatus(result -> {
            if (result) {
                myLocationListener.enable();
            }
        });
  }
}
```

### 自定义 LifecycleOwner

```Java
public class MyActivity extends Activity implements LifecycleOwner {
    private LifecycleRegistry mLifecycleRegistry;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mLifecycleRegistry = new LifecycleRegistry(this);
        mLifecycleRegistry.markState(Lifecycle.State.CREATED);
    }

    @Override
    public void onStart() {
        super.onStart();
        mLifecycleRegistry.markState(Lifecycle.State.STARTED);
    }

    @NonNull
    @Override
    public Lifecycle getLifecycle() {
        return mLifecycleRegistry;
    }
}
```

## LifecycleObserver

```Java
public class MyObserver implements LifecycleObserver {
    @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
    public void onResume() {
    }
 
    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    public void onPause() {
    }
}
aLifecycleOwner.getLifecycle().addObserver(new MyObserver());
```

## 使用 Lifecycle 的例子

先是一个会造成内存泄漏的例子：

```Java
class MyActivity extends AppCompatActivity {
    private MyLocationListener myLocationListener;

    public void onCreate(...) {
        myLocationListener = new MyLocationListener(this, location -> {
            // update UI
        });
    }

    @Override
    public void onStart() {
        super.onStart();
        Util.checkUserStatus(result -> {
            // ！这个地方，如果这个check的语句执行时间很长，在 onStop 之后才执行完，那么下面的
 myLocationListener 就只有 start() 没有 stop() 了。
            if (result) {
                myLocationListener.start();
            }
        });
    }

    @Override
    public void onStop() {
        super.onStop();
        myLocationListener.stop();
    }
}
```

换成使用 Lifecycle 来实现：

```Java
class MyLocationListener implements LifecycleObserver {
    private boolean enabled = false;
    public MyLocationListener(Context context, Lifecycle lifecycle, Callback callback) {
       ...
    }

    @OnLifecycleEvent(Lifecycle.Event.ON_START)
    void start() {
        if (enabled) {
           // connect
        }
    }

    public void enable() {
        enabled = true;
        if (lifecycle.getCurrentState().isAtLeast(STARTED)) { // ！这是最关键的一句。
            // connect if not connected
        }
    }

    @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
    void stop() {
        // disconnect if connected
    }
}
```

```Java
class MyActivity extends AppCompatActivity {
    private MyLocationListener myLocationListener;

    public void onCreate(...) {
        myLocationListener = new MyLocationListener(this, getLifecycle(), location -> {
            // update UI
        });
        Util.checkUserStatus(result -> {
            if (result) {
                myLocationListener.enable();
            }
        });
  }
}
```




