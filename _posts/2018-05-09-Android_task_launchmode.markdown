---
layout: post
title: "Android Activity Task launch mode"
date: 2018-05-09 23:52:00 +0800
tags: develop android
published: true
---
# Android Activity Task launch mode

基本上，task / task stack / back stack / 任务栈 / 回退栈 说的是一回事。

## 进程

在默认情况下，一个应用程序的所有组件运行在同一个进程中。

在 manifest 中用 process 属性指定组件所运行的进程的名字，同一个应用程序的不同组件可以运行在不同的进程中。

## Task stack

在 Activity 中可以用 `getTaskId()` 获取当前 Activity 所在的 task 的 ID 

Task 就是用户为了完成某个功能而执行的一系列 Activity 序列。栈结构，栈顶的 Activity 就是屏幕正在展示的 Activity

Task 中的 Activity 不一定属于同一个应用，Activity 可能会多次实例化（即使 Activity 来自不同的 Task）

当用户启动应用时，该应用的 Task 将出现在前台。 如果应用不存在 Task（应用最近未曾使用），则会创建一个新 Task，并且该应用的`主Activity` 加入这个栈中。

启动一个 Activity 会把这个 Activity 加入栈顶，之前的栈顶 Activity 会保存状态。用户按 `返回` 键会把栈顶的 Activity 出栈并 destroy，之前的栈顶 Activity 会恢复状态。 

当用户开始新任务（比如点击`主页`键转到主屏幕），整个栈移动到后台。 栈中的所有 Activity 全部停止。

当系统资源紧张时，可能将非栈顶 Activity 销毁，在非栈顶 Activity 又变成栈顶 Activity 时重建。此时需要 `onSaveInstanceState()` 保存状态，以便在重建时恢复状态

默认情况下，如果一个应用在后台呆的太久，系统就会对该应用的 Task 进行清理，除了根 Activity，其他 Activity 都会被清理出栈。

## taskAffinity

taskAffinity 可以简单理解成 Task 的名称。默认的 taskAffinity 是 包名。可以给 Activity 设置不同的 taskAffinity。

Activity 的 taskAffinity 可以设置成一个空字符串，表明这个 Activity 不属于任何 Task。

不同的 APP 的 Activity 也可以有相同的 taskAffinity。他们会进入同一个 Task 中，尽管这些 Activity 不在一个应用进程中。

## launch mode

 launch mode 定义 Activity 的新实例 与 当前 Task 如何关联

可以在 manifest 中定义，也可以在 startActivity 的 Intent 中定义

- standard （默认）

不管 Task 里有没有，都创建一个新的 Activity 放在栈顶，谁启动的这个 Activity，这个 Activity 实例就在谁的 Task 中。一个 Task 可以拥有同一个 Activity 的多个实例。

当非 Activity 的 Context 以 standard 去启动一个 Activity 时，会报错，因为非 Activity 的 Context 没有 Task 。如果想让非 Activity 的 Context 去启动 Activity ，需要让 Activity 设置一个 `FLAG_ACTIVITY_NEW_TASK` 标记，这样就会创建一个新 Task ，此时这个 Activity 的 launch mode 实际上是 singleTask 。

- singleTop

如果要启动的 Activity 正好在堆栈顶部，那就直接用它，而不去创建新的实例（会调用 onNewIntent ，而 onCreate 和 onStart 不会被调用），如果没在栈顶，则行为与 standard 一样。

- singleTask

会先在系统中查找有相同 taskAffinity 的 Task 是否存在。如果有，它就会在这个 Task 中启动。

如果相同 taskAffinity 的 Task 中已经存在相应的 Activity 实例，会把位于这个 Activity 实例上面的 Activity 全部结束掉，让这个 Activity 实例位于栈顶。并调用 onNewIntent ，而 onCreate 和 onStart 不会被调用。有`FLAG_ACTIVITY_CLEAR_TOP`的效果。

如果相同 taskAffinity 的 Task 中没有 Activity 实例，则新建实例，加入这个栈的栈顶。

如果没有相同 taskAffinity 的 Task ，就创建带有 taskAffinity 属性的新的 Task ，并创建 Activity 实例，加入这个新栈。

- singleInstance

这个 Activity 在整个系统中只会存在于一个它专有的 Task ，这个 Task 里只有这一个 Activity 实例。只要存在这个栈，就存在 Activity 实例，反之亦然。

启动这个 Activity 时，如果系统不存在这个 Task ，则创建一个栈，并创建这个 Activity 实例加入栈中。

如果存在这个 Task ，则直接跳转到这个栈中，调用栈里这个 Activity 实例的 onNewIntent 。 （只创建一个实例，单独放在一个 task 堆栈里给别的 task 栈**共享**）

被这个 singleInstance 的 Activity 启动的任何 Activity 都会运行在其他 Task 中，被启动的 Activity 在启动时，行为与 singleTask 模式一样。

## allowTaskReparenting

如果 allowTaskReparenting 设置为 true，现在这个 Activity 的实例已经存在于一个 Task  T1 中，此时，如果另一个 Task  T2 启动，并且 T2 的 taskAffinity 跟这个 Activity 的值相同，那么这个 Activity 实例会从 T1 移动到 T2 中。
 
如果这个属性没有设置，那么其对应的 <application> 元素的 allowTaskReparenting 属性值就会应用到这个 Activity 上。它的默认值是false。

应用场景：
短信应用里，短信详情 Activity 中，用户点击了一个网页地址超链接，就会启动浏览器应用的 网页浏览 Activity 。此时的 Task  T1 是 短信详情 Activity - 网页浏览 Activity 。
如果这个网页浏览 Activity  的 allowTaskReparenting 设置为 true。在用户回到屏幕然后启动了 浏览器应用时，会将 T1 中的 网页浏览 Activity 转移到当前新的 Task 中 并打开。

## alwaysRetainTaskState

默认情况下，如果一个应用在后台呆的太久，系统就会对该应用的 Task 进行清理，除了根 Activity，其他 Activity 都会被清理出栈，但是如果在根 Activity 中设置了 alwaysRetainTaskState 为 true 之后，就不会清理。用户再次打开时，仍然可以看到上一次操作的界面。 

应用场景：
浏览器打开了很多标签页，每次打开浏览器都保存了这些标签页的打开状态。 

## clearTaskOnLaunch

当应用进入后台后，然后用户再次打开时。如果根 Activity 的 clearTaskOnLaunch 为 false，则按照默认规则执行。如果根 Activity 的 clearTaskOnLaunch 为 true，则 Task 中除了根 Activity 之外所有的 Activity 都会被清理出栈。（被清理出栈的 Activity 中如果有 allowTaskReparenting 设置了 true 的，会被转移到 taskAffinity 相同的 Task 中）

## finishOnTaskLaunch

当应用进入后台后，然后用户再次打开时。如果 Task 中某个 Activity 的 finishOnTaskLaunch 为 true，则把这个 Activity 从 Task 中清理出栈。


## 相关的 Intent FLAG

- `FLAG_ACTIVITY_NEW_TASK`

与 launchMode 是 singleTask 时，行为相同。

- `FLAG_ACTIVITY_SINGLE_TOP`

与 launchMode 是 singleTop 时，行为相同。

- `FLAG_ACTIVITY_CLEAR_TOP`

如果指定 Activity 的 launchMode 属性没有值。如果要启动的 Activity 已在当前任务中运行，则会销毁 Task 里此 Activity 上方的所有 Activity，并通过 `onNewIntent()` 将此 Intent 传递给 Activity 已恢复的实例（现在位于顶部）。

如果指定 Activity 的 launchMode 为 standard ，则该 Activity 也会从堆栈中移除，并在其位置启动一个新实例，以便处理传入的 Intent。

`FLAG_ACTIVITY_CLEAR_TOP` 通常与 `FLAG_ACTIVITY_NEW_TASK` 结合使用，这样可以找到其他任务中的现有 Activity，并将其放入可从中响应 Intent 的位置。


## 参考

官方文档中任务和返回栈，其中 singleTask 部分讲的一泡稀。

<https://developer.android.com/guide/components/tasks-and-back-stack>

<https://blog.csdn.net/luoshengyang/article/details/6714543>


