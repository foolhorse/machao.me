---
layout: post
title: "设计模式 创建篇"
date: 2018-04-26 00:41:00 +0800
tags: develop oo
published: true
---

## 单例模式

```
public class Singleton{
    private volatile static Singleton instance;
    private Singleton(){};
    public static Singleton getInstance(){
        if(instance==null){
            sychronized(Singleton.class){
                if(instance==null)
                    instance=new Singleton();
            }
        }
        return instatnce;
    }
}
```

## Builder 模式 Builder Pattern

类似一个更可控的构造函数，可以方便控制参数的配置顺序，

```
public class MyData{
    private int id;
    private String num; 
    public void setId(int id){
        this.id=id;
    }
    public void setNum(String num){
        this.num = num + "id"; // 注意这里
    }

    public class MyBuilder{
        private int id;
        private String num;
        public MyData build(){
            MyData d = new MyData();
            d.setId(id);
            d.setNum(num);
            return t;
        }
        public MyBuilder setId(int id){
            this.id=id;
            return this;
        }
        public MyBuilder setNum(String num){
            this.num=num;
            return this;
        }
    }
}
```

## 工厂模式

工厂模式又有几个不同的实现方式：

### 简单工厂模式 Simple Factory / 静态工厂方法 Static Factory Method 

因为工厂方法是静态方法，所以使用起来很方便，可通过类名直接调用，只需要传入参数即可，在实际开发中，还可以在调用时将所传入的参数保存在 XML/JSON 等格式的配置文件中。

简单工厂模式最大的问题在于工厂类的职责相对过重，增加新的产品需要修改工厂类的判断逻辑。

所有的生产都在一个工厂中，工厂无法继承，也无法将不同的产品在不同的工厂中生产。

```
public abstract class Instrument{
    public abstract void play();
} 

public class Guitar extends Instrument{
    public void play(){
        System.out.println("guitar solo");
    }
}

public class Bass extends Instrument{
    public void play(){
        System.out.println("bass slap");
    }
}

public class FenderFactory{

    // 注意这里是 static 方法
    public static Instrument create(int type){
        if(type == 1){
            return new Guitar();
        }else if(type == 2){
            return new Bass();
        }else{
            return null;
        }
    }
}
```

### 工厂方法模式 Factory method

当系统需要加入新产品时，无须修改现有代码，而只要添加相应的具体工厂和具体产品就可以了。

在业务复杂的时候，也会使用工厂模式去生产 工厂方法模式中的具体工厂类。

```
public abstract class Instrument{
    public abstract void play();
} 

public class Guitar extends Instrument{
    public void play(){
        System.out.println("guitar solo");
    }
}

public class Bass extends Instrument{
    public void play(){
        System.out.println("bass slap");
    }
}

public abstract class InstrumentFactory{
    // 可以有参数，也可以没有
    public abstract Instrument create(int type);
}

public class FenderGuitarFactory extends InstrumentFactory{

    public Instrument create(int type){
        return new Guitar();
    }
}
```

### 抽象工厂模式 Abstract Factory Pattern

通常用在多种产品有依赖关系，产品原料有不同来源的情况。

```
public abstract class Guitar{
    public abstract void assemble();
}

public abstract class Pickup{
    public abstract void create();
}

public class Telecaster extends Guitar{

    PickupFactory pickupFactory;

    public Telecaster(PickupFactory pickupFactory){
        this.pickupFactory = pickupFactory ;
    }

    public void assemble(){
        pickupFactory.createPickup();
        System.out.println("用各种部件，组装吉他");
    }
}

public class SingleCoil extends Pickup{
    public void createPickup(){
        System.out.println("生产单线圈拾音器");
    }
}

public abstract class GuitarFactory{
    public abstract Guitar createGuitar();
}

public abstract class PickupFactory{
    public abstract Pickup createPickup();
}

public class FenderFactory extends GuitarFactory{

    // 零件工厂也可以在 create 函数中实例化，视具体情况而定
    PickupFactory pickupFactory = new SeymourDuncanFactory();

    public Guitar createGuitar(int model){
        // 这里同样可以通过参数 if else 去生产不同产品
        return new Telecaster(pickupFactory);
    }
}

public class GibsonFactory extends GuitarFactory{
    
}

public class SeymourDuncanFactory extends PickupFactory{
    public Pickup createPickup(int model){
        // 这里同样可以通过参数 if else 去生产不同产品
        return new SingleCoil();
    }
}
```


## 原型模式 Prototype

这个模式感觉像个凑数的。😂。将一个对象进行拷贝。
JAVA 继承 Cloneable，重写 clone()


## 参考

<https://en.wikipedia.org/wiki/Design_Patterns>

