---
layout: post
title: "设计模式 结构篇"
date: 2018-04-26 00:41:00 +0800
tags: develop oo
published: true
---
# 「已发布」设计模式 结构篇

装饰者、适配器、外观，代理，这几种模式在代码层面很相似，主要的区别在于对应的业务作用的区别。

## 组合模式 Composite Pattern
 
Android 里的 View 和 ViewGroup

树形结构以表示"部分-整体"的层次结构( View 可以做为 ViewGroup 的一部分)。

组合模式使得 户对  单个对象 View 和 组合对象 ViewGroup 的使用具有一致性。


## 适配器模式 Adapter Pattern

也叫 Wrapper 或者 Translator。

国标插座转换成英标插座的电源适配器，这个适配器模式的作用与电源适配器作用完全一样。

业务作用是将一个接口变为另一个接口。

```
interface MusicPlayer{
    public void play() ;   
}

interface Singer{
    public void sing();
}

class MusicPlayerAdapter implements Singer{

    MusicPlayer musicPlayer

    public MusicPlayerAdapter(MusicPlayer musicPlayer){
        this.musicPlayer = musicPlayer;
    }
    public void singSong(){
        this.musicPlayer.play();
    }
}

public class AdpaterDemo{
    public static void main(String args[]){
        MusicPlayer musicPlayer = new MusicPlayer();
        Singer musicPlayerAdapter = new MusicPlayerAdapter(musicPlayer) ;
        musicPlayerAdapter.sing() ;
    }
}

```

## 外观模式 Facade

对于复杂的调用，比如有复杂顺序要求，有许多繁琐的 api 等，或者有些 api 的调用不想暴露出来，用一个外观类作为对外的门面，在这里用对外一个函数去调用那些复杂的内部函数。

比如 Android 中的 Context，内部有很多复杂功能通过比如 startActivty、sendBroadcast、bindService 实现。

```
class CPU {
    public void freeze() { ... }
    public void jump(long position) { ... }
    public void execute() { ... }
}

class HardDrive {
    public byte[] read(long lba, int size) { ... }
}

class Memory {
    public void load(long position, byte[] data) { ... }
}

/* Facade */
class ComputerFacade {
    private CPU processor;
    private Memory ram;
    private HardDrive hd;

    public ComputerFacade() {
        this.processor = new CPU();
        this.ram = new Memory();
        this.hd = new HardDrive();
    }

    public void start() {
        processor.freeze();
        ram.load(BOOT_ADDRESS, hd.read(BOOT_SECTOR, SECTOR_SIZE));
        processor.jump(BOOT_ADDRESS);
        processor.execute();
    }
}

/* Client */
class You {
    public static void main(String[] args) {
        ComputerFacade computer = new ComputerFacade();
        computer.start();
    }
}
```


## 装饰者模式 Decorator

可以在运行时，动态的添加和删除某一个或者多个功能。贯彻单一职责原则的好方法。

装饰者模式很像责任链模式，区别是在责任链中有一个明确的类来处理请求，而在装饰者模式中 ，所有的装饰者都参与处理请求。

可以实现类似多继承的效果。（实际上是多层的继承）

Java 的 IO 使用就是典型的装饰者模式

```
// The interface Coffee defines the functionality of Coffee implemented by decorator
public interface Coffee {
    public double getCost(); // Returns the cost of the coffee
    public String getIngredients(); // Returns the ingredients of the coffee
}

// Extension of a simple coffee without any extra ingredients
public class SimpleCoffee implements Coffee {
    @Override
    public double getCost() {
        return 1;
    }

    @Override
    public String getIngredients() {
        return "Coffee";
    }
}

// Abstract decorator class - note that it implements Coffee interface
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee decoratedCoffee;

    public CoffeeDecorator(Coffee c) {
        this.decoratedCoffee = c;
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost();
    }

    @Override
    public String getIngredients() {
        return decoratedCoffee.getIngredients();
    }
}

// Decorator WithMilk mixes milk into coffee.
// Note it extends CoffeeDecorator.
class WithMilk extends CoffeeDecorator {
    public WithMilk(Coffee c) {
        super(c);
    }

    @Overriding
    public double getCost() {
        return super.getCost() + 0.5;
    }

    @Overriding
    public String getIngredients() {
        return super.getIngredients() + ", Milk";
    }
}

// Decorator WithSprinkles mixes sprinkles onto coffee.
// Note it extends CoffeeDecorator.
class WithSprinkles extends CoffeeDecorator {
    public WithSprinkles(Coffee c) {
        super(c);
    }

    @Overriding
    public double getCost() {
        return super.getCost() + 0.2;
    }

    @Overriding
    public String getIngredients() {
        return super.getIngredients() + ", Sprinkles";
    }
}

public class Main {
    public static void printInfo(Coffee c) {
        System.out.println("Cost: " + c.getCost() + "; Ingredients: " + c.getIngredients());
    }

    public static void main(String[] args) {
        Coffee c = new SimpleCoffee();
        printInfo(c);
        c = new WithMilk(c);
        printInfo(c);
        c = new WithSprinkles(c); // 类似于 c = new WithMilk(new WithSprinkles(c));
        printInfo(c);
    }
}

```


## 代理模式 Proxy Pattern

对于调用者来说，操作并没有不同，看起来是一样的。

但是真正的处理过程是通过代理人完成，代理人可以加上一些自己的操作，可以是增加操作，也可以是修改操作。

代理与装饰者的一个重要区别是：代理中可以实例化真正的操作对象。而装饰者只能包装现有的操作对象。

比如代理服务器就是修改请求，一些商品的销售代理就是把货品卖给你的同时自己也抽成。

```
interface Give{
    public void giveMoney() ;
}

class RealGive implements Give{
    public void giveMoney(){
        System.out.println(real give money") ;
    }
}

class GiveProxy implements Give{

    private Give give = null ;

    public GiveProxy(Give give){
        this.give = give ;
    }

    public void before(){
        System.out.println("before") ;
    }
    
    public void after(){
        System.out.println("after") ;
    }
    public void giveMoney(){
        this.before() ;
        this.give.giveMoney() ;
        this.after() ;
    }
}

public class ProxyDemo{
    public static void main(String args[]){
        Give give = new GiveProxy(new RealGive()) ;
        give.giveMoney() ;
    }
}
```

## 桥接模式 bridge

将抽象部分与实现部分分离，使他们独立地进行变化。 抽象部分和实现部分（固有操作）的区别依据具体的业务逻辑而定。

其实就是，一个类除了本身的固有操作，还存在两个或者多个维度的变化，且这多个维度都扩展的可能，使用桥接模式可以方便在多个维度进行扩展。

也可以达到类似多继承的效果。本质上是通过增加耦合，不用继承。

与装饰者模式的区别在于：装饰者模式把多出来的部分放到单独的类里面，每个单独的类都是一个单一的功能。桥接模式则把多出来的功能按照某种维度抽象出来，形成不同的接口/抽象类，然后让具体的不同功能按照他的维度去实现不同的接口。

> 某个功能的具体实现 是 类 的某个成员变量 来提供。

```
/** "Implementor" */
interface DrawingAPI {
    public void drawCircle(int x, int y, int radius);
    public void drawDot(int x, int y);
}

/** "ConcreteImplementor"  1/2 */
class DrawingAPIWindows implements DrawingAPI {
    public void drawCircle(int x, int y, int radius) {
        System.out.printf("API Windows circle);
    }
     public void drawCircle(int x, int y) {
        System.out.printf("API Windows dot);
    }
}

/** "ConcreteImplementor" 2/2 */
class DrawingAPIUbuntu implements DrawingAPI {
    public void drawCircle(int x, int y, int radius) {
        System.out.printf("API Ubuntu circle);
    }
   public void drawCircle(int x, int y) {
        System.out.printf("API Ubuntu dot);
    }
}

/** "Abstraction" */
abstract class Shape {
    protected DrawingAPI drawingAPI;

    protected Shape(DrawingAPI drawingAPI){
        this.drawingAPI = drawingAPI;
    }

    public abstract void draw();                                 // low-level
    public abstract void resizeByPercentage(final double pct);   // high-level
}

/** "Refined Abstraction" */
class CircleShape extends Shape {
    private int x, y, radius;
    public CircleShape(int x, double y, int radius, DrawingAPI drawingAPI) {
        super(drawingAPI);
        this.x = x;  this.y = y;  this.radius = radius;
    }

    // low-level i.e. Implementation specific
    public void draw() {
        drawingAPI.drawCircle(x, y, radius);
    }
    // high-level i.e. Abstraction specific
    public void resizeByPercentage(final double pct) {
        radius *= (1.0 + pct/100.0);
    }
}

/** "Client" */
class BridgePattern {
    public static void main(final String[] args) {
        Shape shape =  new CircleShape(1, 2, 3, new DrawingAPIWindows()),
        shape.resizeByPercentage(2.5);
        shape.draw();
    }
}
```




## 享元模式 Flyweight

Flyweight，蝇量级，拳击里的一个体重级别，在 100 斤上下，基本是最轻的一个拳击级别。

所以，这个模式的目的就是轻，也就是减少内存，减少 io 等各种性能开销，具体的实现方式，就是中文译名：共享单元。

- 可以共享的相同内容称为内部状态(Intrinsic State)
- 需要外部环境来设置的不能共享的内容称为外部状态(Extrinsic State)
- 由于区分了内部状态和外部状态，因此可以通过设置不同的外部状态，使得相同的对象可以具有一些不同的特征，而相同的内部状态是可以共享的。

有 Flyweight Factory，Flyweight 接口，Flyweight 实现类这几个角色。 通常使用某种工厂模式，使用Flyweight Factory  去生产 Flyweight。

仔细一看代码会发现，这不就是个简单的缓存嘛。

```
public interface SmartPhoneModel {
   void double getScreenSize();
}

public IPhone4 implements SmartPhoneModel{

    private String color ;

    public IPhone4(String color){
        this.color = color ;
    }

    void double getScreenSize(){
        return 3.5 ;
    }
}
 
public class SmartPhoneFactory {
    private static final Map<String, SmartPhone> extrinsicStateKeyCache = new HashMap<>();

    public static SmartPhoneModel getSmartPhone(String color) {
        SmartPhoneModel smartPhoneModel = extrinsicStateKeyCache.get(modelStr);

        if(smartPhoneModel == null) {
            smartPhoneModel = new IPhone4(color);
            extrinsicStateKeyCache.put(color, smartPhoneModel);
        }
        return smartPhoneModel;
    }
}
```


## 参考

<https://en.wikipedia.org/wiki/Design_Patterns>
<http://design-patterns.readthedocs.io/zh_CN/latest/index.html>
