---
layout: post
title: "Android Architecture Components Paging Library"
date: 2018-01-07 23:57:00 +0800
tags: develop android
published: true
---
# Android Architecture Components Paging Library

## DataSource

用来管理数据源，包括数据的获取，数据列表中的 null 节点是否做连续处理以及相应的 placeholders 是否显示 empty view 。

与 `PagedList<Foo>` 类互为基友。作为 Paging Library 的核心类。

库中带了三个抽象类：

- `PageKeyedDataSource <Key , Value>` 请求数据时，使用类似页码的参数的情况。
- `ItemKeyedDataSource <Key , Value>` 适用情况：使用当前列表的最后一个 item 的 ID 来获取下一页的数据
- `PositionalDataSource <T> `之前叫 TiledDataSource，适用于目标数据总数固定，通过特定的位置加载数据，类似数据库的 limit 和 offset，比如从数据库中的从 1200 条到后面的 20 条数据。

以上三种 Datasource 使用时需要实现其中的抽象方法。在这些抽象方法的各个实现方法中添加获取数据的逻辑，比如初始化数据的逻辑，获取翻页时数据的逻辑等。

### DataSource.Factory

用来创建 Datasource 的接口，可以作为 LivePagedListBuilder 的参数。

如果数据源需要定制。则定义一个`DataSource.Factory`实现类。覆写 create 方法返回一个定制的 DataSource 类，可以实现 DataSource 的三个抽象子类获得定制的 DataSource 类。

如果使用 Room 库管理数据，那么 Room 可以创建一个产出 PositionalDataSource 的  `DataSource.Factory`：

```
@Query("select * from users WHERE age > :age order by name DESC, id ASC")
DataSource.Factory<Integer, User> usersOlderThan(int age);
```

在需要刷新数据时，调用 DataSource 的 invalidate() 会重新创建 PagedList 和 DataSource ，从而刷新数据。


## PagedList

与 DataSource 类一起作为核心类。PagedList 是 `AbstractList<T>` 的子类。

PagedList 使用 PagedList.Config 的配置，通过 Datasource 加载数据，另外为 RecyclerView.Adapter 提供更新信号

几个重点成员变量：

- mMainThreadExecutor 和 mBackgroundThreadExecutor 成员变量里有负责进程切换的 
- mBoundaryCallback  当 Datasource 中的数据加载到边界时的回调
- mStorage 是一个 PagedStorage<T> 实例，用于存储加载到的数据，这个类也是 AbstractList<T>的子类，它包含一个 `ArrayList<List<T>>` 的成员变量  mPages，这里放着真正使用的数据，按页存储数据。

### PagedList.Config

配置 PagedList 从 Datasource 加载数据的方式， 有以下属性：
- pageSize ：每页加载的数量 
- prefetchDistance ：预加载的数量 
- initialLoadSizeHint ：初始化时加载的数量 
- enablePlaceholders ：当 item 为 null 时，是否显示 PlaceHolder 


## LivePagedListBuilder

以前这个功能叫 LivePagedListProvider

这个类用你提供的 DataSource 中生成他的基友  `LiveData<PagedList<Foo>> `

LivePagedListBuilder 构造方法可以传入两个参数，一个 `DataSource.Factory<Key, Value>`，一个PagedList.Config。


## PagedListAdapter

继承自 RecyclerView.Adapter 。专门用于 PagedList 。
构造方法需要传入 DiffCallback 实现类

内部主要干活的是 PagedListAdapterHelper 这个类的实例。

PagedListAdapterHelper 会监听 PagedList 发来的更新通知并调用`notifyDataChanged()`，也会统计 Item 数量。

PagedListAdapterHelper 类中有一个 ListAdapterConfig 类的实例，负责主线程和后台线程的调度以及 DiffCallback 的管理， 

当数据源变动时，或者在 `setList()` 时， 在后台线程中调用 PagedStorageDiffHelper 类的静态方法， 通过 DiffCallback 的接口实现（其中定义了比较规则），去比较新旧两个 PagedList 的差异，然后自动调用 `notifyItem...()` 方法更新 RecyclerView。


## DiffCallback 

Override 两个方法 `public boolean areItemsTheSame` ，`public boolean areContentsTheSame `

通常放在数据 DataBean 或者放在 ListAdapter 中。


## 使用

数据类 ，里面包含了 DIFF_CALLBACK，也可以放在 ListAdapter 中。
```
@Entity
class User {
     // ... simple POJO code omitted ...
 
     public static final DiffCallback<User> DIFF_CALLBACK = new DiffCallback<Customer>() {
         @Override
         public boolean areItemsTheSame( @NonNull User oldUser, @NonNull User newUser) {
             // User properties may have changed if reloaded from the DB, but ID is fixed
             return oldUser.getId() == newUser.getId();
         }
         @Override
         public boolean areContentsTheSame( @NonNull User oldUser, @NonNull User newUser) {
             // NOTE: if you use equals, your object must properly override Object#equals()
             // Incorrectly returning false here will result in too many animations.
             return oldUser.equals(newUser);
         }
     }
}
```

dao 类，使用 room 库的时候会自动生成 DataSource。所以可以直接返回 LivePagedListBuilder，用来生成实际需要的 `LiveData<PagedList<Foo>>` 数据
```
@Dao
interface UserDao {
    @Query("SELECT * FROM user ORDER BY lastName ASC")
    public abstract DataSource.Factory<Integer, User> usersByLastName();
}
```

PagedListAdapter，构造方法里传入 DIFF_CALLBACK
```
class UserAdapter extends PagedListAdapter<User, UserViewHolder> {
    public UserAdapter() {
        super(User.DIFF_CALLBACK);
    }
    @Override
    public void onBindViewHolder(UserViewHolder holder, int position) {
        User user = getItem(position);
        if (user != null) {
            holder.bindTo(user);
        } else {
            // Null defines a placeholder item - PagedListAdapter will automatically invalidate
            // this row when the actual object is loaded from the database
            holder.clear();
        }
    }
}
```

在 ViewModel 中通过 `LivePagedListBuilder` 创建 `LiveData<PagedList<Foo>>` 
LivePagedListBuilder 会接收一个 DataSource.Factory 类型的参数：
如果使用 Room 库，那么在 dao 类中的 操作方法可以返回这个 DataSource.Factory 。
如果需要定制数据源，则定制一个  DataSource.Factory 即可。

```
class MyViewModel extends ViewModel {
    public final LiveData<PagedList<User>> usersList;
    public MyViewModel(UserDao userDao) {
        usersList = new LivePagedListBuilder<>( 
                      userDao.usersByLastName(), 20 )
                .build();
    }
}
```

在 Activity 中的 RecyclerView 。主要是创建 Adapter，用 viewModel 中的 `LiveData<PagedList<Foo>>` 调用 observe，在数据变化的回调中调用  `adapter.setList(pagedList)` 。
```
UserAdapter<User> adapter = new UserAdapter();
viewModel.usersList.observe(this, pagedList -> adapter.setList(pagedList));
recyclerView.setAdapter(adapter);
```








