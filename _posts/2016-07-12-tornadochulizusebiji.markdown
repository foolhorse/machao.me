---
layout: post
title:  "tornado处理阻塞笔记"
date:   2016-07-12 23:59:00 +0800
tags: develop python tornado
published: true
---

在 linux 上 tornado 是基于 epoll 的事件驱动框架，所以创建 socket 连接这一层面是无阻塞的。但是因为 tornado 自身是单线程的，所以在处理业务逻辑时容易发生阻塞，需要尽量把时间长的操作通过各种不同的方式包装成事件扔进 io_loop。

@tornado.web.asynchronous 

标记这个 RequestHandler 里有异步的代码，比如 RequestHandler 使用了回调式的http请求：
```python
http.fetch("http://www.foolhorse.com/", callback=self.on_response)
```
加时上 @asynchronous 需要在该请求结束的时候手动调用 self.finish()。如果不加这个 decorator 则不会像一般的没有异步逻辑的 RequestHandler 那样自动 self.finish()。

@tornado.gen.coroutine

基于 tornado.concurrent.Future

如果语句返回的是 future 可以使用 yield 自动将 future 的 result 取出并使用 generator.send() 函数返回给调用处，本质就是个语法糖。

@tornado.concurrent.run_on_executor

基于 tornado.concurrent.Future 和 concurrent.futures.ThreadPoolExecutor （ 需要 python 3.2 以上的 concurrent.futures包 ）

主要作用就是针对那些不能返回 future 的但是会造成阻塞的语句，比如 time.sleep() 这样的。给函数加上这个 decorator 的话这个函数就可以返回一个 future ，能返回 future 就可以配合 @gen.coroutine 使用了。
另外需要注意的是函数所在的类需要定义 executor 和 io_loop（ io_loop默认在 RequestHandler 中已经定义了 ）。


 
