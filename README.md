# react-native-zfetch


### usage

yarn add react-native-zfetch or npm install --save react-native-zfetch

react-native link rn-fetch-blob


### HeaderUtil

配置请求头header；

HeaderUtil.setHeaders({
    'Header-CompanyId':'',
    'Header-CurTime':'',
    'Header-UserId':'',
    'Cookie':'token'
});

### serverDomain

配置服务器域名，每个server对应dev，test，uat，production域名环境；

Object.assign(serverDomain, AllEnv);

### serverEnvironment

配置服务器环境；

serverEnvironment.currentEnvironment = 'test'；

### httpNetwork

发起网络请求；

httpNetwork.requestAction(actionUrl.loginAction('zan','123456')); //发起请求

### cancelRequests

取消已发起的网络请求即，httpNetwork.cancelRequests(array);

注：cancelRequests参数传数组，如接口api/test/login，httpNetwork.cancelRequests(['login'])



## Demo
### 1、初始化环境

App.js的componentWillMount中配置，为什么是componentWillMount，Component的生命周期componentWillMount->render->componentDidMout，组件是从子组件父组件由内往外执行渲染，所以在componentWillMount进行初始化配置，子组件componentDidMount中执行执行网络请求时网络相应配置已完成。

```javascript
NetWork.js

import AllEnv from './AllEnv';
import {serverDomain, serverEnvironment, serverInterceptor} from '../netwokModule/dist/index';
import Environment from './Environment';
import interceptor from './serverInterceptor';

const Network = {

    initAppEnvironment: function () {
        serverEnvironment.currentEnvironment = Environment.currentEnvironment;
        Object.assign(serverDomain, AllEnv);
        Object.assign(serverInterceptor, interceptor);
    }
};

export default Network;


App.js 

import Network from './script/networkConfig/Network';

componentWillMount() {
    Network.initAppEnvironment();
}
```

### 2、拦截器与适配器

```javascript
test:{
        interceptorResponse:function (json, action) {

            console.log('do something');

            return responseInterceptor.interceptResponse(json, action);
        },

        handlerResponseData:function (json) {

            return {};
        }
    }
    注意：test表示的是服务器名，多服务器时可以为每个服务器配置不同的拦截逻辑；


const responseInterceptor = {

    interceptResponse:function (json,action) {
        
        //处理自己的逻辑

        return { isIntercept:false, message:'成功了', error:{} };
    }
};
```

### 3、发起网络请求与取消网络请求

```javascript
TestPage.js

import { httpNetwork } from 'react-native-zfetch';

componentDidMount() {
    httpNetwork.requestAction(actionUrl.loginAction('xxx','xxx',pageName), (data) => {

    }); //发起请求
}

componentWillUnmount() {
    httpNetwork.cancelRequests(['XXX']); //取消网络请求
}
```
