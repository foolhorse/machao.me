---
layout: post
title: "Android 访问记录 UsageStatsManager"
date: 2018-03-27 23:06:00 +0800
tags: develop android
published: true
---

# Android 访问记录 UsageStatsManager

5.0 之前，可以使用 `ActivityManager` 来获取应用相关信息

比如：
```
ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
List<RunningAppProcesInfo> runningAppProcesInfoList = am.getRunningAppProcesses();
```

5.0 之后，需要使用 UsageStatsManager 获取手机中的应用信息。

需要权限 `android.permission.PACKAGE_USAGE_STATS`
用户必须在 设置 – 安全 – 有权查看使用情况的应用 中勾选相应的应用
部分国产手机不能使用这个API，比如魅族和小米之类的。

获得 UsageStatsManager 
```
UsageStatsManager usageStatsManager = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
```

获取  UsageStats 数据，包含应用的包名，使用总时长，最后一次使用时间等。
```
Calendar calendar=Calendar.getInstance();
calendar.setTime(new Date());
long endTime = calendar.getTimeInMillis();//结束时间
calendar.add(Calendar.DAY_OF_MONTH, -1);//时间间隔为一个月
long beginTime = calendar.getTimeInMillis();//开始时间

UsageStatsManager usageStatsManager=(UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
List<UsageStats> queryUsageStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_MONTHLY,beginTime,endTime);

```
这里有三个参数：
- intervalType
- beginTime
- endTime

关于 intervalType
UsageStats 数据是以自然年月日来储存的，所以请求数据时，是以第二个和第三个参数落在的时间间隔里包含的自然年月日的数据。
划分级别有4个：
- INTERVAL_DAILY 日长短级别数据 最长7天内的数据
- INTERVAL_WEEKLY 星期长短级别数据 最长4个星期内的数据
- INTERVAL_MONTHLY 月长短级别数据 最长6个月内的数据
- INTERVAL_YEARLY 年长短级别数据 最长2年内的数据，也就是说，数据最长保存2年
- INTERVAL_BEST 根据提供的时间间隔（根据与第二个参数和第三个参数获取），自动搭配最好的级别

另外：
在 Android P 版本后，UsageStatsManager 新加了一个 API：`getAppStandbyBucket()`，作用是：

在 Android 6.0 时，推出了 Doze模式和 Standby 机制，主要目的就是为了省电。

这个方法可以获取当前应用的所在的 Standby 状态。这个状态由当前应用的行为（比如当前不显示在屏幕上）和当前手机的电池电量决定。

不同的 Standby 状态会限制应用后台运行任务的数量，比如  jobs, alarms 还有一些 PendingIntent 的 callback。

返回的 Standby 状态有：STANDBY_BUCKET_ACTIVE，STANDBY_BUCKET_WORKING_SET,，STANDBY_BUCKET_FREQUENT ，STANDBY_BUCKET_RARE。



参考：<https://developer.android.com/reference/android/app/usage/UsageStatsManager.html>










