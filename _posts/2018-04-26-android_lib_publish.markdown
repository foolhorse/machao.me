---
layout: post
title: "Android 库的打包和发布"
date: 2018-04-26 12:07:00 +0800
tags: develop android lib
published: true
---
# Android 库的打包和发布

一个库项目的构建过程与一般项目是一样的。

如果只需要一个 aar 文件的话，只需要在`./gradlew assembleRelease`之后，在项目的 `build/outputs/aar` 目录下就会生成 aar 文件。然后在使用这个库的的项目里添加这个依赖就可以了
```
repositories {
    flatDir {
        dirs 'libs' //this way we can find the .aar file in libs folder
    }
}
```
```
dependencies {
    compile(name:'test', ext:'aar')
}·
```

如果需要上传到比如 jcenter 这类中央仓库。除了打包，还需要上传到 jcenter 的仓库中。

打包成 maven 仓库支持的格式，需要使用 maven，Android 项目可以通过 gradle 调用 maven，但是 maven 默认并不支持 Android 的库，所以需要使用这个：<https://github.com/dcendents/android-maven-gradle-plugin>

如果配置好这个插件之后，执行一下 build，就可以在项目的 build 目录下生成 JavaDoc 和 sourceJAR 等文件了。

上传到 jcenter ，可以直接在 bintray 的网站上传上面的到的文件，也可以使用 bintray 自己出的这个插件：<https://github.com/bintray/gradle-bintray-plugin>

打包上传的 gradle 脚本我放在 github gist 中了：<https://gist.github.com/foolhorse/2175dc920e43e4abc27f72e792352fad>

使用时，在根项目的 `build.gradle` 中添加
```
dependencies {
        classpath 'com.github.dcendents:android-maven-gradle-plugin:2.1'
        classpath 'com.jfrog.bintray.gradle:gradle-bintray-plugin:1.8.0'
    }
```

在库项目的 `build.gradle` 中添加
```
apply from: 'https://gist.githubusercontent.com/foolhorse/2175dc920e43e4abc27f72e792352fad/raw/1bfcb2b0d6fbbbb0169672f5df79f887a95fb3e8/gradle-bintray-push.gradle'

```

在库项目的目录下的给项目新建一个 gradle.properties ，里面放上各个需要的属性，比如：
```
# Project
PROJECT_NAME=lightframeview
PROJECT_PACKAGE_NAME=me.machao.lightframeview
PROJECT_DESCRIPTION=LightFrameView is able to provide a light frame animation by wrapping it to a normal View.

PROJECT_VERSION_NAME=1.0.0
PROJECT_VERSION_DESC=

PROJECT_SITE=https://github.com/foolhorse/AndroidLightFrameView
PROJECT_GIT_URL=https://github.com/foolhorse/AndroidLightFrameView.git
PROJECT_ISSUE_URL=https://github.com/foolhorse/AndroidLightFrameView/issues

PROJECT_LICENCE_NAME=Apache-2.0
PROJECT_LICENCE_URL=http://www.apache.org/licenses/LICENSE-2.0.txt

# Developer
DEVELOPER_NAME=machao
DELELOPER_EMAIL=

# POM
POM_SCM_URL=https://github.com/foolhorse/AndroidLightFrameView
POM_SCM_CONNECTION=scm:git:https://github.com/foolhorse/AndroidLightFrameView.git
POM_SCM_DEVELOPER_CONNECTION=scm:git:https://github.com/foolhorse/AndroidLightFrameView.git

# Bintray
BINTRAY_REPO=mavenrepo
BINTRAY_LABELS=android,animation
BINTRAY_VCS_TAG=
```
敏感信息，比如 bintray 的用户名密码等，放在 local.properties 里。
```
BINTRAY_USER=your_user_name
BINTRAY_USER_ORG=
BINTRAY_API_KEY=your_api_key
BINTRAY_GPG_PASSPHRASE=
```
当然，这些属性也可以不用 `gradle.properties` 的形式，因为`gradle.properties` 不能很好的支持变量的类型。也可以在  `build.gradle`  中添加 `ext {}` 直接写 groovy 代码的变量.



