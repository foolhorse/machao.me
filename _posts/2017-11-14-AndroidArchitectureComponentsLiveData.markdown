---
layout: post
title: "Android Architecture Components LiveData"
date: 2017-11-14 23:52:00 +0800
tags: develop android
published: true
---
# Android Architecture Components LiveData

LiveData 是一个可监听的数据容器，可以在数据变化的时候通知观察者。LiveData 可以感知生命周期，因此观察者可以指定某一个 LifeCycle 给 LiveData。

如果观察者指定 LifeCycle 处于 Started 或者 RESUMED 状态，LiveData 会将观察者视为活动状态，并通知其数据的变化。

如果 LifeCycle 不在 Started 或者 RESUMED 这两个状态，那么观察者将无法接受到数据更新的回调，即使数据发生了变化。

如果 LifeCycle 销毁了，即生命周期结束，观察者将被自动从 LiveData中移除。

使用 setValue 改变值。

addObserver 方法可以添加监听，第一个参数是一个 LifeCycleOwner，第二个参数是 Observer。

## 使用

```Java
public class NameViewModel extends ViewModel {
    private MutableLiveData<String> mCurrentName;
    public MutableLiveData<String> getCurrentName() {
        if (mCurrentName == null) {
            mCurrentName = new MutableLiveData<String>();
        }
        return mCurrentName;
    }
}
```

```Java
public class NameActivity extends AppCompatActivity {
    private NameViewModel mModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mModel = ViewModelProviders.of(this).get(NameViewModel.class);
        final Observer<String> nameObserver = new Observer<String>() {
            @Override
            public void onChanged(@Nullable final String newName) {
                // Update the UI
                mNameTextView.setText(newName);
            }
        };
        mModel.getCurrentName().observe(this, nameObserver);
    }
}
```

```Java
mButton.setOnClickListener(new OnClickListener() {
    @Override
    public void onClick(View v) {
        String anotherName = "John Doe";
        mModel.getCurrentName().setValue(anotherName);
    }
});
```

## Extends LiveData

通常用于 LiveDate 的数据变化不是由 UI 交互产生的时候。因为如果是由 UI 交互产生的，那么这个改变事件出现的时候， UI 的生命周期通常处于活动状态。
有两个可以覆写的方法:

```onActive()``` 当 LiveData 具有活动状态的 Observer 的时候会调用这个函数

```onInactive()``` 当 LiveData 没有活动状态的 Observer 的时候会调用这个函数

使用 LocationManager 是一个很典型的例子：

```Java
public class LocationLiveData extends LiveData<Location> {
    private LocationManager locationManager;
 
    private LocationListener listener = new LocationListener() {
        @Override
        public void onLocationChanged(Location location) {
            Log.d("TAG", "onLocationChanged() called with: location = [" + location + "]");
            setValue(location);
        }
         ...
    };
 
    public LocationLiveData(Context context) {
        locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
    }
 
    @Override
    protected void onActive() {
        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 5000, 0, listener);
    }
 
    @Override
    protected void onInactive() {
        locationManager.removeUpdates(listener);
    }
}
```

```Java
public class LiveDataActivity extends LifecycleActivity {
    private TextView mTextView;
 
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mTextView = (TextView) findViewById(R.id.text);
 
        LiveData<Location> myLocationLiveData = new LocationLiveData(getApplicationContext());
        Util.checkUserStatus(result -> {
            if (result) {
                myLocationLiveData.observe(this, location -> {
                    // update UI
                    mTextView.setText(location.getLatitude() + ", " + location.getLongitude());
                });
            }
        });
    }
}
```

## LiveData 转换

在 LiveData 将变化的数据通知给观察者前，改变数据的类型；

- Transformations.map()

```Java
LiveData<User> userLiveData ;
LiveData<String> userName = Transformations.map(userLiveData, user -> {
    user.name + " " + user.lastName
});
```
 
- Transformations.switchMap()

与Transformations.map() 类似，但是 switchMap( )的方法必须返回一个 LiveData 对象。

```Java
private LiveData<User> getUser(String id) {
  ...;
}
LiveData<String> userIdLiveData = ...;
LiveData<User> user = Transformations.switchMap(userIdLiveData, id -> getUser(id) );
```

例子：

```Java
class MyViewModel extends ViewModel {
    private final PostalCodeRepository repository;
    public MyViewModel(PostalCodeRepository repository) {
       this.repository = repository;
    }
    private LiveData<String> getPostalCode(String address) {
       return repository.getPostCode(address);
    }
}
```

这样写问题显然很严重，当每次调用 getPostalCode 方法后，UI 代码中都需要对 getPostalCode 的返回值做注册观察者操作，并且还要移除上一个观察者，这样显然是低效率的。此外，如果这时UI因为配置的变化（屏幕旋转）重建了，那么它会触发再次调用 getPostalCode，而不是使用之前的调用结果。

因此我们可以做如下转换：

```Java
class MyViewModel extends ViewModel {
    private final PostalCodeRepository repository;
    private final MutableLiveData<String> addressInput = new MutableLiveData();
    public final LiveData<String> postalCode = Transformations.switchMap(addressInput, 
 (address) -> {
                return repository.getPostCode(address);
             });

  public MyViewModel(PostalCodeRepository repository) {
      this.repository = repository
  }

  private void setInput(String address) {
      addressInput.setValue(address);
  }
}
```

注意，这里我们将postalCode访问限制符写成public final，因为它将始终不变，UI只要在需要用的时候将观察者注册到postalCode中就行。这是当用户调用setInput后，如果 postalCode 上有可活动的观察者，那么 repository.getPostCode(address) 就会被调用，如果此时没有可活动的观察者，则repository.getPostCode(address) 不会被调用。

- 自定义转换 MediatorLiveData

在你的应用中可能需要除了上面两种以外更多的LiveData的转换，为了实现这些转换，你可以使用MediatorLiveData类，它可以用来正确的处理其他多个LiveData的事件变化，并处理这些事件。MediatorLiveData会将自身的active/inactive状态变化正确的传递给它所处理的LiveData，例如MediatorLiveData没有观察者的话，
 







 


