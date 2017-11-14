---
layout: post
title: "Android Architecture Components ViewModel"
date: 2017-11-14 23:51:00 +0800
tags: develop android
published: true
---
# Android Architecture Components ViewModel

用于持有和管理数据，通常持有 LiveData，处理数据持久化，存取等具体逻辑， 相当于 MVP 中的 Presenter。

ViewModel 与特定的 Activity 或 Fragment 实例无关。ViewModel 可以在 Activity 配置更改中保留其状态。它保存的数据立即可用于下一个 Activity 实例，而不需要在 onSaveInstanceState() 中保存数据，并手动还原。

```Java
public class MyViewModel extends ViewModel {
    private MutableLiveData<List<User>> users;
    public LiveData<List<User>> getUsers() {
        if (users == null) {
            users = new MutableLiveData<List<Users>>();
            loadUsers();
        }
        return users;
    }

    private void loadUsers() {
        // Do an asyncronous operation to fetch users.
    }
}
```

```Java
public class MyActivity extends AppCompatActivity {
    public void onCreate(Bundle savedInstanceState) {
        // 在 Activity 重建的时候将会收到之前 Activity 里的 MyViewModel
        MyViewModel model = ViewModelProviders.of(this).get(MyViewModel.class);
        model.getUsers().observe(this, users -> {
            // update UI
        });
    }
}
```

ViewModel 之所以能在 Activity/Fragment 重建的时候依旧能保持，是因为通过 ViewModelProviders 创建的 ViewModel，而不是 new 一个 ViewModel。

ViewModelProviders 通过 ViewModelStore 来管理 ViewModel，ViewModelStore 的一个 map 容器存储 ViewModel,通过 Activity 作为 key 区分,假设是同一个 Activity(哪怕不是同一个对象)，就返回同一个 ViewModel，直到 Activity 销毁则移除。

原理是通过给 Activity 添加一个 HolderFragment，设置 ```setRetainInstance(true);```(屏幕旋转时,保持数据的状态)

## 不同的 Fragment 同一个Activity

```Java
public class SharedViewModel extends ViewModel {
    private final MutableLiveData<Item> selected = new MutableLiveData<Item>();
    public void select(Item item) {
        selected.setValue(item);
    }
    public LiveData<Item> getSelected() {
        return selected;
    }
}
```

```Java
public class MasterFragment extends Fragment {
    private SharedViewModel model;
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        model = ViewModelProviders.of(getActivity()).get(SharedViewModel.class);
        itemSelector.setOnClickListener(item -> {
            model.select(item);
        });
    }
}
```

```Java
public class DetailFragment extends Fragment {
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SharedViewModel model = ViewModelProviders.of(getActivity()).get(SharedViewModel.class);
        model.getSelected().observe(this, { item ->
           // Update the UI.
        });
    }
}
```

## 生命周期

ViewModel 的生命周期与传递给 ViewModelProvider 的 LifeCycle 一致。

ViewModel 不能引用 View 或者其他与 Activity / Fragment 生命周期相关的对象。否则就失去了 ViewModel 的意义，ViewModel 可以通过包含 LifecycleObservers 对象监听生命周期，比如 LiveData 。如果 ViewModel 需要应用的上下文（如查找系统服务），可以通过继承 AndroidViewModel 类，有一个构造函数来接收 Application 实例。


## 取代 Loader

比如：使用 ViewModel + LiveData + Room 取代 CursorLoader
使用 ViewModel + liveData 取代 AsyncTaskLoaer

## 参考文章

<https://developer.android.google.cn/topic/libraries/architecture/viewmodel.html>

https://medium.com/@Viraj.Tank/android-architecture-components-viewmodel-internals-should-you-use-it-for-mvps-presenter-6bf7b770cf12






