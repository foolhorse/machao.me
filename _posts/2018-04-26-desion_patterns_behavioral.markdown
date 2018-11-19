---
layout: post
title: "设计模式 行为篇"
date: 2018-04-26 00:41:00 +0800
tags: develop oo
published: true
---
# 设计模式 行为篇

## 策略模式 Strategy Pattern

函数的参数是个接口 / 抽象类，那么这个函数就可以接收接口的不同实现类的实例。

对于接口定义的方法，这些不同的接口实现类中，不同的方法实现，就代表了不同的策略。

Andriod 中 使用动画时，你可以选择线性插值器 LinearInterpolator、加速减速插值器AccelerateDecelerateInterpolator、减速插值器 DecelerateInterpolator 等，这就是不同的策略

```
interface IShareStrategy{
    void share(String msg);
}

class WeiboStrategy implements IShareStrategy{
    void share(String){
        // do media things
    }
}

class WechatStrategy implements IShareStrategy{
    void share(String){
        // do greate wall things
    }
}
 
public class ShareModel{
    String msg;
    void setMsg(String msg){
        this.msg = msg ;
    }
    // 也可以让 ShareModel 持有一个 IShareStrategy 引用。
    void share(IShareStrategy strategy){
        strategy.share(msg);
    }
}
```

## 状态模式 State

用于 context 的不同状态时，同样的操作调用不同的行为。

与策略模式的本质区别是：状态模式的 context 存在一个持续存在的状态。而策略模式处理的行为是单一的，一次性的。

也就是 context 会持有一个 state （由 context 自己创建），同时 state 也可以持有 context （可以作为类的成员变量，也可以作为函数的参数）。

因为持有 context，所以 state 的函数里可以给 context 替换其他的 state。

```
interface Statelike {
    void writeName(StateContext context, String name);
}

class StateLowerCase implements Statelike {
    @Override
    public void writeName(final StateContext context, final String name) {
        System.out.println(name.toLowerCase());
        context.setState(new StateMultipleUpperCase());
    }
}

class StateMultipleUpperCase implements Statelike {
    /** Counter local to this state */
    private int count = 0;

    @Override
    public void writeName(final StateContext context, final String name) {
        System.out.println(name.toUpperCase());
        /* Change state after StateMultipleUpperCase's writeName() gets invoked twice */
        if(++count > 1) {
            context.setState(new StateLowerCase());
        }
    }
}

class StateContext {
    private Statelike myState;
    StateContext() {
        setState(new StateLowerCase());
    }

    /**
     * Setter method for the state.
     * Normally only called by classes implementing the State interface.
     * @param newState the new state of this context
     */
    void setState(final Statelike newState) {
        myState = newState;
    }

    public void writeName(final String name) {
        myState.writeName(this, name);
    }
}
```


## 命令模式 Command

三种角色：调用者 Invoker，命令 Command，接收者 Receiver
接收者 可以有多种，比如 电灯，电视，
每个接收可以有多种命令，比如打开电灯关闭电灯，电视换台电视音量增加
业务流程是 调用者 发送命令 给接受者执行。
```
public interface Command {
   void execute();
}

/** The Invoker class */
public class Switch {

   public void execute(final Command cmd) {
      cmd.execute();
   }
}

/** The Receiver class */
public class Light {

   public void turnOn() {
      System.out.println("The light is on");
   }

   public void turnOff() {
      System.out.println("The light is off");
   }
}

/** The Command for turning on the light - ConcreteCommand #1 */
public class LightOnCommand implements Command {
   private Light theLight;

   public LightOnCommand(final Light light) {
      this.theLight = light;
   }

   @Override  
   public void execute() {
      theLight.turnOn();
   }
}

/** The Command for turning off the light - ConcreteCommand #2 */
public class LightOffCommand implements Command {
   private Light theLight;

   public LightOffCommand(final Light light) {
      this.theLight = light;
   }

   @Override 
   public void execute() {
      theLight.turnOff();
   }
}

/* The test class or client */
public class PressSwitch {
   public static void main(final String[] arguments){
      final Light lamp = new Light();
      final Command switchUp = new LightOnCommand(lamp); 
      final Switch mySwitch = new Switch();
      mySwitch.execute(switchUp);
      
   }
}
```

## 中介者模式 mediator

也叫调停者模式。

系统中对象之间存在复杂的引用关系，类之间的交互很复杂时，通过一个中间类来切断类之间的交互，所有交互都通过中介者中转。

GUI 开发中的 MVC，MVP 之类的这些几乎都会用到中介者模式，下面的代码就很类似 View 之间的相互操作。

```
interface Mediator {
    void registerColleague1(Colleague c);
    void operationColleague1(String arg);

    void registerColleague2(Colleague c);
    void operationColleague2(String arg);
}

class ConcreteMediator implements Mediator {

    // 也可以使用 map 来存多个实例。
    Colleague c1 ;
    Colleague c2 ;

    void setColleague1(Colleague c){
        this.c1 = c ;
    }
    void operationColleague1(String arg){
        this.c1.operation(arg);
    }
    void setColleague2(Colleague c){
        this.c2 = c ;
    }
    void operationColleague2(String arg){
        this.c2.operation(arg);
    }
}

interface Colleague {
    void setMediator(Mediator mediator);
    void operation(String arg);
}

class ConcreteColleague1 implements Colleague {

    Mediator mediator;

    void void setMediator(Mediator mediator){
        this.mediator = mediator;
        this.mediator.setColleague1(this);
    }
    void operation(String arg) {
        System.out.println("Colleague1 "+arg);
    }
}
 
class ConcreteColleague2 implements Colleague {

    Mediator mediator;

    void void setMediator(Mediator mediator){
        this.mediator = mediator;
        this.mediator.setColleague2(this);
    }
    void operation(String arg) {
        System.out.println("Colleague2 "+arg);
        this.mediator.operationColleague1("called from Colleague2");
    }
}

public class Demo {
    public static void main(String[] args) {
        Mediator mediator = new ConcreteMediator();
        Colleague c1 = new ConcreteColleague1();
        Colleague c2 = new ConcreteColleague1();
        c1.setMediator(mediator);
        c2.setMediator(mediator);

        c2.operation("hahaha");
    }
}
```

## 访问者模式 Visitor

使用一个访问者类，改变了数据类的执行算法。这样，执行的算法可以随着访问者改变而改变。

可以在不改变数据结构的前提下，定义一些新的操作。

有这几个角色：Element 接口，Element 具体实现类（数据所在类）。Visitor 接口，Visitor 具体实现类。

Element 接口定义了 accept 方法。Visitor 接口定义了访问不同 Element（参数是不同的 Element） 的 visit 方法。

在使用时，Client 会调用 Element 的 accept，把 Element 具体实现类暴露给 Visitor 实现类，达到可以随访问者不同而操作不同的目的。访问者模式实际上违反了依赖倒置原则，依赖了具体类，没有依赖抽象。

Android中 中 APT 技术，就是在编译期使用访问者模式。

```
interface Element {
    void accept(Visitor visitor);
}

interface Visitor {
    void visit(Head head);
    void visit(Body body);
}

class Head implements Element {
    public void accept(final Visitor visitor) {
        visitor.visit(this);
    }
}

class Body implements Element {
    public void accept(final Visitor visitor) {
        visitor.visit(this);
    }
}

class Animal implements Element {
    Element[] elements;

    public Animal() {
        this.elements = new Element[] {
            new Head(), 
            new Body()
        };
    }

    public void accept(final Visitor visitor) {
        for (Element elem : elements) {
            elem.accept(visitor);
        }
        visitor.visit(this);
    }
}

class DoVisitor implements Visitor {
    public void visit(final Head head) {
        System.out.println("call some head function or something");
    }
    public void visit(final Body body) {
        System.out.println("change body type");
    }
}

class PrintVisitor implements Visitor {
    public void visit(final Head head) {
        System.out.println("print head status");
    }
    public void visit(final Body body) {
        System.out.println("print body status");
    }
}

public class Demo {
    public static void main(final String[] args) {
        final Animal animal = new Animal();
        animal.accept(new PrintVisitor());
        animal.accept(new DoVisitor());
    }
}
```


## 模版方法模式 template method 

这个是 Android 应用开发天天打交道的内容，onCreate，onStart，onResume，都是模版方法。

public abstract class Game {
   abstract void initialize();
   abstract void startPlay();
   abstract void endPlay();

   public final void play(){

      //初始化游戏
      initialize();

      //开始游戏
      startPlay();

      //结束游戏
      endPlay();
   }
}

public class Football extends Game {
   @Override
   void initialize() {
      System.out.println("Football Game Initialized! Start playing.");
   }
   @Override
   void startPlay() {
      System.out.println("Football Game Started. Enjoy the game!");
   }
   @Override
   void endPlay() {
      System.out.println("Football Game Finished!");
   }
}

public class TemplatePatternDemo {
   public static void main(String[] args) {

      game = new Football();
      game.play();        
   }
}

## 迭代器模式 Iterator

提供一种方法顺序访问一个容器对象中的各个元素，而不需要暴露该对象的内部表示。

Iterator 这个角色的思想与组合模式类似。

Java 中的迭代器 Iterator 类，就是一个迭代器模式的模版接口。Android 中，Cursor 用到的迭代器模式，SQLiteDatabase 的 query 返回的就是 Cursor对象
```
interface Aggregate{
    void Iterator getIterator();
}

interface Iterator{
    void Object next();
    void boolean hasNext();
}

class ConcreteAggregate implements Aggregate{
    private Object[] datas ;

    public Iterator getIterator(){
        return new ConcreteIterator();
    }

    class ConcreteIterator implements Iterator{
        int index;

        @Override
        public boolean hasNext() {
            if(index < datas.length){
                return true;
            }
            return false;
        }

        @Override
        public Object next() {
            if(this.hasNext()){
                return datas[index++];
            }
            return null;
        }
    }

}
```


## 责任链模式 Chain-of-responsibility


由一堆命令模式中的命令角色 和 一些处理对象 组成。

if else 的 OO 版本，可以在 runtime 动态的安排功能。

责任链模式与装饰者模式在结构上很相似，但是区别在于业务角色的功能不同，装饰者的所有装饰者角色都负责一个功能，责任链中只有一个特别的类负责处理功能。

OkHttp 中 chain 的调用，也是一种责任链模式

```
abstract class PurchasePower {
    protected static final double BASE = 500;

    protected PurchasePower successor;

    abstract protected double getAllowable();
    abstract protected String getRole();

    public void setSuccessor(PurchasePower successor) {
        this.successor = successor;
    }

    public void processRequest(PurchaseRequest request) {
        if (request.getAmount() < this.getAllowable()) {
            System.out.println(this.getRole() + " will approve $" + request.getAmount());
        } else if (successor != null) {
            successor.processRequest(request);
        }
    }
}

class ManagerPPower extends PurchasePower {
    protected double getAllowable() {
        return BASE * 10;
    }
    protected String getRole() {
        return "Manager";
    }
}

class DirectorPPower extends PurchasePower {
    protected double getAllowable() {
        return BASE * 20;
    }
    protected String getRole() {
        return "Director";
    }
}

class VicePresidentPPower extends PurchasePower {
    protected double getAllowable() {
        return BASE * 40;
    }
    protected String getRole() {
        return "Vice President";
    }
}

class PurchaseRequest {

    private double amount;

    public PurchaseRequest(double amount, String purpose) {
        this.amount = amount;
    }
    public double getAmount() {
        return this.amount;
    }
    public void setAmount(double amount)  {
        this.amount = amount;
    }
}

class CheckAuthority {
    public static void main(String[] args) {
        ManagerPPower manager = new ManagerPPower();
        DirectorPPower director = new DirectorPPower();
        VicePresidentPPower vp = new VicePresidentPPower();

        manager.setSuccessor(director);
        director.setSuccessor(vp);

        manager.processRequest(new PurchaseRequest(13000, "General"));
    }
}
```

## 备忘录模式 Memento

保存程序不同状态时的状态数据，可以用来实现存档，撤销，暂存，备份等操作。

主要特点是可以在不破坏封闭的前提下，保存一个对象的内部状态，并在对象之外保存这个状态。

Android 中 Activity 的 onSaveInstanceState 和 onRestoreInstanceState 就是运用了备忘录模式。

```
// 存放状态数据的类
public class Memento {
   private String state;
   public Memento(String state){
      this.state = state;
   }
   public String getState(){
      return state;
   }
}

// 业务逻辑所在的类
public class Originator {
   private String state;
   public void setState(String state){
      this.state = state;
   }
   public String getState(){
      return state;
   }
   public Memento saveStateToMemento(){
      return new Memento(state);
   }
   public void getStateFromMemento(Memento memento){
      state = memento.getState();
   }
}

// 管理状态，所有存档都在内存中。如果有需要，也可以在这里实现使用外部存储的机制。
public class CareTaker {
   private List<Memento> mementoList = new ArrayList<Memento>();
   public void add(Memento state){
      mementoList.add(state);
   }
   public Memento get(int index){
      return mementoList.get(index);
   }
}

public class MementoPatternDemo {
   public static void main(String[] args) {
      Originator originator = new Originator();
      CareTaker careTaker = new CareTaker();
      originator.setState("State #1");
      originator.setState("State #2");
      careTaker.add(originator.saveStateToMemento());
      originator.setState("State #3");

      System.out.println("Current State: " + originator.getState());        
      originator.getStateFromMemento(careTaker.get(0));
      System.out.println("First saved State: " + originator.getState());
   }
}
```


## 观察者模式 Observer Pattern

这也是一个与状态操作相关的模式，一个对象的状态发生改变时，所有依赖于它的对象都得到通知 并 可以自动更新

Java 中有专门的 java.util.Observable 类 和 java.util.Observer 接口，其中 Observable 与下面的代码的区别只是多加了一个 setChanged() 方法，标记 Observable 对象的数据已经发生变化。

- 抽象主题(Subject)角色 / Observable
抽象主题角色 把 所有对观察者对象 的引用 保存在一个集合（比如 ArrayList 对象）里，每个 Subject 都可以有任何数量的观察者。抽象主题提供一个接口，可以增加和删除观察者对象，Subject 角色又叫做 抽象 Observable 

- 具体主题(ConcreteSubject)角色 / Concrete Observable 
将有关状态存入具体观察者对象；在具体主题的内部状态改变时，给所有登记过的观察者发出通知。具体主题角色又叫做 Concrete Observable 

- 抽象观察者(Observer)角色：
为所有的具体观察者定义一个接口，在得到主题的通知时更新自己，这个接口叫做更新接口。

- 具体观察者(ConcreteObserver)角色：
存储与主题的状态自恰的状态。具体观察者角色实现抽象观察者角色所要求的更新接口，以便使本身的状态与 Subject 的状态相同。如果需要，ConcreteObserver 可以持有一个指向具体主题对象的引用。
 
```Java
public abstract class Subject {
  private List<Observer> list = new ArrayList<Observer>();
  public void attach(Observer observer){   
  list.add(observer);
  }
  public void detach(Observer observer){
  list.remove(observer);
  }
  public void nodifyObservers(String newState){
  for(Observer observer : list){
  observer.update(newState);
  }
  }
}
```

```Java
public class ConcreteSubject extends Subject{
  private String state;
  public String getState() {
  return state;
  }
  public void setState(String newState){
  state = newState;
  //状态发生改变，通知各个观察者
  this.nodifyObservers(state);
  }
}
```

```Java
public interface Observer {
  public void update(String state);
}
```

```Java
public class ConcreteObserver implements Observer {
  private String observerState;

  @Override
  public void update(String state) {
  observerState = state;
  }
}
```

```Java
public class Client {
  public static void main(String[] args) {
  ConcreteSubject subject = new ConcreteSubject();
  Observer observer = new ConcreteObserver();
  subject.attach(observer);
  subject.setState("new state");
  }
}
```

## 解释器模式 Interpreter

对于一种固定文法语句或者说一种表达式，定义一个解释器，用来解释语言中的句子。

如果还能记得编译原理的课程，这个解释器模式跟编译原理中的解释器是一种东西。

解释器模式并不负责解析出语法树。从代码来说，解释器模式只是一个典型的面向对象多态。

主要角色是 Expression 声明一个抽象的解释操作，该接口为抽象语法树中所有的节点共享。

Expression 有两个子类，TerminalExpression 和 NonterminalExpression。分别是终结符表达式和非终结符表达式。终结符通常就是一些运算符和控制符，所以终结符表达式通常是一个小运算单元。另外还有 context / client 角色。

通常来说，各种 parser，比如 Android 开发中常用的布局解析 XML parser 都会使用解释器模式。

```
public interface Expression {
    int interpret();
}

public class NonterminalExpression implements Expression {
    private int value;

    public NonterminalExpression(int value) {
        this.value = value;
    }

    public int interpret() {
        return this.value;
    }
}

public abstract class TerminalExpression implements Expression {
    protected Expression left;
    protected Expression right;

    public TerminalExpression(Expression left, Expression right) {
        this.left = left;
        this.right = right;
    }
}

public class Plus extends TerminalExpression {
    public Plus(Expression left, Expression right) {
        super(left, right);
    }

    public int interpret() {
        return left.interpret() + right.interpret();
    }
}

public class Minus extends TerminalExpression {
    public Minus(Expression left, Expression right) {
        super(left, right);
    }

    public int interpret() {
        return super.left.interpret() - super.right.interpret();
    }
}

public class Evaluator {
    private String statement;
    private Expression expression;

    public Evaluator(String statement) {
        Expression left = null, right = null;
        Stack stack = new Stack();

        String[] statementArr = statement.split(" ");

        for (int i = 0; i < statementArr.length; i=i+1) {
            if (statementArr[i].equalsIgnoreCase("+")) {
                left = (Expression) stack.pop();
                int val = Integer.parseInt(statementArr[i+1]);
                i=i+1
                right = new NonterminalExpression(val);
                stack.push(new Plus(left, right));
            } else if (statementArr[i].equalsIgnoreCase("-")) {
                left = (Expression) stack.pop();
                int val = Integer.parseInt(statementArr[i+1]);
                i=i+1
                right = new NonterminalExpression(val);
                stack.push(new Minus(left, right));
            } else {
                stack.push(new NonterminalExpression(Integer.parseInt(statementArr[i])));
            }
        }
        this.expression = (Expression) stack.pop();
    }

    public int compute()
        return expression.interpret();
}

public class Client {
    public static void main(String args[]) {
        String statement = "11 + 6 - 1";
        Evaluator evaluator = new Evaluator(statement);
        int result = evaluator.compute();
        System.out.println(statement + " = " + result);
    }
}
```


## 参考

<https://en.wikipedia.org/wiki/Design_Patterns>





