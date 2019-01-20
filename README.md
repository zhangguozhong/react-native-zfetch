# react-native-zfetch


### usage

yarn add react-native-zfetch or npm install --save react-native-zfetch

react-native link rn-fetch-blob

react-native link react-native-cookies


### requestHeaders

配置请求头header；

configHeader.setHeaders({
    'Header-CompanyId':'',
    'Header-CurTime':'',
    'Header-UserId':'',
    'Cookie':'token'
});

### serverApi

配置服务器域名列表，每个server对应dev，test，uat，production域名环境；

for (let env in AllEnv) {
  serverApi[env] = AllEnv[env];
}

### serverEnv

配置服务器环境；

serverEnv.currentEnv = 'test'；

### httpClient

发起网络请求，配置response拦截器与适配器；

httpClient.registerResponseInterceptor(responseInterceptor); //注入拦截器

httpClient.registerAdapter(responseAdapter); //注入适配器

httpClient.requestAction(actionUrl.loginAction('zan','123456',pageName)); //发起请求

### cancelRequestInPage

取消已发起的网络请求即，httpClient.cancelRequestInPage(pageName);

注：pageName可使用react-navigation-props-helper，const { pageName } = this.props;



## Demo
### 初始化环境

App.js的componentWillMount中配置，为什么是componentWillMount，Component的生命周期componentWillMount->render->componentDidMout，render渲染子组件父组件由内往外执行，所以在componentWillMount进行初始化配置比较稳妥。

```javascript
App.js 

import { serverEnv,serverApi,httpClient } from 'react-native-zfetch';

componentWillMount() {
    serverEnv.currentEnv = 'test';
    for (let env in AllEnv) {
        serverApi[env] = AllEnv[env];
    }

    httpClient.registerResponseInterceptor(responseInterceptor); //注入拦截器
    httpClient.registerAdapter(responseAdapter); //注入适配器
}
```

### 发起网络请求与取消网络请求

```javascript
TestPage.js

import { httpClient } from 'react-native-zfetch';

componentDidMount() {
    const { pageName } = this.props;
    httpClient.requestAction(actionUrl.loginAction('xxx','xxx',pageName), (data) => {

    }); //发起请求
}


componentWillUnmount() {
    const { pageName } = this.props;
    httpClient.cancelRequestInPage(pageName); //取消网络请求
}
```
