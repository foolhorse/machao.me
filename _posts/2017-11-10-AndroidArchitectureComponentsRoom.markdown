---
layout: post
title: "Android Architecture Components Room"
date: 2017-11-10 00:11:00 +0800
tags: develop android
published: true
---
# Android Architecture Components Room

## Room

一个给 SQLite 用的 ORM。

在 android.arch.persistence 包及其子包中。

项目的 build.gradle ，注意这个新加的 maven 仓库地址。一定概率需要爱国爬墙。

```groovy
allprojects {
    repositories {
        jcenter()
        maven { url 'https://maven.google.com' }
    }
}
```
app 模块的 build.gradle
```groovy
// For Room, add:
implementation "android.arch.persistence.room:runtime:1.0.0"
annotationProcessor "android.arch.persistence.room:compiler:1.0.0"
// For testing Room migrations, add:
testImplementation "android.arch.persistence.room:testing:1.0.0"
// For Room RxJava support, add:
implementation "android.arch.persistence.room:rxjava2:1.0.0"
```

### Entity 注解
 
```Java
@Entity
class User {
    @PrimaryKey
    private int id;
    @ColumnInfo(name = "name")
    private String name;
    private String gender;
    // getters and setters for fields
}
```

当一个类用 @Entity注解并且被 @Database 注解中的 entities 属性所引用，Room 就会在数据库中为那个 entity 创建一张表。

默认 Room 会为 entity 中定义的每一个 field 都创建一个列，使用 @Ignore 注解可以不被作为数据库的表的列

要持久化一个 field，Room 必须有获取它的渠道。要么把 field 写成 public，要么提供一个setter和getter。

#### Primary key

每个 entity 必须至少定义一个 field 作为主键（primary key）。即使是只有一个 field 时。

@PrimaryKey 的 autoGenerate 属性可以让 Room 为 entity 设置自增 ID 。

```Java
@Entity
public class User {
    @PrimaryKey(autoGenerate = true)
    private Integer id;
}
```

如果是组合主键，你可以使用 @Entity 注解的 primaryKeys 属性

```Java
@Entity(primaryKeys = {"firstName", "lastName"})
class User {
    public String firstName;
    public String lastName;
}
```

#### 表名

Room 默认把类名作为数据库的表名。如果你想用其它的名称，使用 @Entity 注解的 tableName 属性
注意 SQLite 中的表名是大小写敏感的。
```Java
@Entity(tableName = "users")
class User {
}
```

#### 列名

Room 默认把 field 名称作为数据库表的 column 名。如果你想让 column 使用其他名称，为 field 添加 @ColumnInfo 注解并使用 name 属性

```Java
@Entity
class User {
    @ColumnInfo(name = "first_name")
    public String firstName;
    ...
}
```

#### 索引

要为一个 entity 添加索引，在 @Entity 注解中添加 indices 属性，列出你想放在索引或者 组合索引 中的字段。
```Java
@Entity(indices = {@Index("id"), @Index("firstName", "lastName")})
class User {
    @PrimaryKey
    public int id;
    public String firstName;
    public String lastName;
}
```

#### UNIQUE 约束

通过把 @Index 注解的 unique 属性设置为 true 来实现唯一性。
下面的代码防止了一个表中的两行数据出现firstName和lastName字段的值相同的情况：

```Java
@Entity(indices = {
        @Index(
            value = {"firstName", "lastName"},
            unique = true)
        })
class User {
    @PrimaryKey
    public int id;
    public String firstName;
    public String lastName;
}
```

#### 关系
 
Room 禁止 entity 对象相互引用，但是允许定义 entity 之间的外键（Foreign Key）约束。

外键可以指定当被关联的 entity 更新时做什么操作。
例如，通过在 @ForeignKey 注解中包含 Delete = CASCADE 时，如果相应的 User 实例被删除，那么删除这个 User 下的所有 book。

```Java
@Entity(foreignKeys = @ForeignKey(entity = User.class,
                                  parentColumns = "id",
                                  childColumns = "userId"))
class Book {
    @PrimaryKey
    public int bookId;
    public String title;
    public int userId;
}
```

#### 嵌套对象

使用 @Embedded 注解，把一个 Entity 中某个 对象 field 的变量分解为表的字段。
比如，我们的 User 类可以包含一个类型为 Address 的 field，Address 代表 street,city,state, 和 postCode 字段的组合。为了让这些组合的字段单独存放在这个表中，对 User 类中的 Address 字段使用 @Embedded 注解,
那么现在代表一个User对象的表就有了如下的字段：:id,firstName,street,state,city, 以及post_code。

嵌套字段也可以包含其它的嵌套字段。
如果一个 entity 有多个嵌套字段是相同名字，你可以设置 prefix 属性保持每个字段的唯一性。Room 就会在嵌套对象中的每个字段名的前面添加上这个值。

```Java
class Address {
    public String city;
    @ColumnInfo(name = "post_code")
    public int postCode;
}
 
@Entity
class User {
    @PrimaryKey
    public int id;
    public String firstName;
    @Embedded
    public Address address;
}
```
 
### Dao 注解

一个定义 Dao 操作的接口。Room 会在编译时生成这个类的实现。

```Java
@Dao
public interface UserDao {
    @Insert(onConflict = REPLACE)
    void save(User user);
    @Query("SELECT * FROM user WHERE id = :userId")
    LiveData<User> load(String userId);
}
```

#### Insert

将所有的参数（数据）在一次事务中插入数据库

如果 @Insert 方法只有一个参数，它可以返回一个 long，代表新插入元素的 rowId，如果参数是一个数组或者集合，那么应该返回 long[] 或者 List<long>。

@Dao
public interface MyDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    public void insertUsers(User... users);
 
    @Insert
    public void insertBothUsers(User user1, User user2);
 
    @Insert
    public void insertUsersAndFriends(User user, List<User> friends);
}

#### Update

Update 是一个更新一系列 entity 的简便方法。它根据参数的主键作为更新的依据。
可以让这个方法返回一个 int 类型的值，表示更新影响的行数。

@Dao
public interface MyDao {
    @Update
    public void updateUsers(User... users);
}

#### Delete

删除一系列 entity。它使用参数的主键找到要删除的 entity。
可以让这个方法返回一个int类型的值，表示从数据库中被删除的行数。

@Dao
public interface MyDao {
    @Delete
    public void deleteUsers(User... users);
}

#### @Query 

@Query 用来执行自定义的读写操作。每个 @Query 方法的 SQL 和返回值类型都会在编译时被检查。

- 简单的查询

一个简单的查询，加载所有的 user。

```Java
@Dao
public interface MyDao {
    @Query("SELECT * FROM user")
    public User[] loadAllUsers();
}
```

- 向 query 传递参数

:minAge 用方法的参数 minAge 匹配。

```Java
@Dao
public interface MyDao {
    @Query("SELECT * FROM user WHERE age > :minAge")
    public User[] loadAllUsersOlderThan(int minAge);
}
```

- 传入参数集合

@Dao
public interface MyDao {
    @Query("SELECT first_name, last_name FROM user WHERE region IN (:regions)")
    public List<NameTuple> loadUsersFromRegions(List<String> regions);
}


- 返回字段的子集

如果只需要一个 entity 的部分字段。只要结果的字段可以和返回的对象匹配就可以开工。

```Java
public class NameTuple {
    @ColumnInfo(name="first_name")
    public String firstName;
    public String lastName;
}
```

在 query 方法中使用这个 POJO，这些值可以被映射到 NameTuple 类的 field 中。因此 Room 可以生成正确的代码。这些 POJO 也可以使用 @Embedded 注解。

```Java
@Dao
public interface MyDao {
    @Query("SELECT first_name, lastName FROM user")
    public List<NameTuple> loadFullName();
}
```


- 可观察的查询

可以在 query 方法中使用 LiveData 类型的返回值。当数据库变化的时候，Room 会生成所有的必要代码来更新 LiveData。

```Java
@Dao
public interface MyDao {
    @Query("SELECT first_name, last_name FROM user WHERE region IN (:regions)")
    public LiveData<List<User>> loadUsersFromRegionsSync(List<String> regions);
}
```

- RxJava

Room 可以让查询返回 RxJava2 的 Publisher 和 Flowable 对象。要使用这个功能，在 Gradle dependencies中添加android.arch.persistence.room:rxjava2。

```Java
@Dao
public interface MyDao {
    @Query("SELECT * from user where id = :id LIMIT 1")
    public Flowable<User> loadUserById(int id);
}
```

- 直接使用 cursor

```Java
@Dao
public interface MyDao {
    @Query("SELECT * FROM user WHERE age > :minAge LIMIT 5")
    public Cursor loadRawUsersOlderThan(int minAge);
}
```

- 联表查询

支持联表查询，并且址可观察特性的数据类型，比如 Flowable 或者 LiveData。

```Java
@Dao
public interface MyDao {
    @Query("SELECT * FROM book "
           + "INNER JOIN loan ON loan.book_id = book.id "
           + "INNER JOIN user ON user.id = loan.user_id "
           + "WHERE user.name LIKE :userName")
   public List<Book> findBooksBorrowedByNameSync(String userName);
}
```

也可以返回自定义的 POJO 对象

```Java
@Dao
public interface MyDao {
   @Query("SELECT user.name AS userName, pet.name AS petName "
          + "FROM user, pet "
          + "WHERE user.id = pet.user_id")
   public LiveData<List<UserPet>> loadUserAndPetNames();
  
   static class UserPet {
       public String userName;
       public String petName;
   }
}
```

### Database 注解和 RoomDatabase

Database 注解的这个类是一个继承 RoomDatabase 的抽象类。通过声明返回值是 Dao 的方法，提供这些 Dao 的使用。
Room 根据它自动提供一个实现。
在运行时，可以通过调用 Room.databaseBuilder() 或者 Room.inMemoryDatabaseBuilder() 来得到它的实例。

```Java
@Database(entities = {User.class}, version = 1)
public abstract class MyDatabase extends RoomDatabase {
  public abstract UserDao userDao();
}
```

#### 获取实例

```Java
AppDatabase db = Room.databaseBuilder(getApplicationContext(), MyDatabase.class, "database-name").build();
```

### 类型转换器
 
使把一个自定义的数据类型，转换成数据库表的 字段
  
例如 一个Date的实例 转换成 Unix timestamp，通过编写如下的 TypeConverter

```Java
public class Converters {
    @TypeConverter
    public static Date fromTimestamp(Long value) {
        return value == null ? null : new Date(value);
    }
 
    @TypeConverter
    public static Long dateToTimestamp(Date date) {
        return date == null ? null : date.getTime();
    }
}
```

然后将 @TypeConverters 注解添加到 AppDatabase 类中，
Room 会自动转换这些自定义的类型，也可以限制 @TypeConverter 的作用范围。

```Java
@Database(entities = {User.java}, version = 1)
@TypeConverters({Converter.class})
public abstract class AppDatabase extends RoomDatabase {
    public abstract UserDao userDao();
}
```
  
### 数据库迁移

随着 app 功能更新，你需要修改 entity 类来反应这些变化。通过定义 Migration 类来完成升级。当用户更新了 app 的最新版本之后，保证数据可用。

每个 Migration 类指定 from 和 to 版本。运行时 Room 运行每个 Migration 类的 migrate() 方法。

如果没有提供必要的 migration，Room 将清空和重建数据库。

为了让迁移的逻辑是可预知的，使用完整的查询而不用引用代表查询的 constant。

```Java
Room.databaseBuilder(getApplicationContext(), MyDb.class, "database-name")
        .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
        .build();
 
static final Migration MIGRATION_1_2 = new Migration(1, 2) {
    @Override
    public void migrate(SupportSQLiteDatabase database) {
        database.execSQL("CREATE TABLE `Fruit` (`id` INTEGER, `name` TEXT, PRIMARY KEY(`id`))");
    }
};
 
static final Migration MIGRATION_2_3 = new Migration(2, 3) {
    @Override
    public void migrate(SupportSQLiteDatabase database) {
        database.execSQL("ALTER TABLE Book "
                + " ADD COLUMN pub_year INTEGER");
    }
};
```
