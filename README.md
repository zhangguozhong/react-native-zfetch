# react-native-zfetch


### requestHeaders

配置请求头header；

configHeader.setHeaders({
    'Header-CompanyId':'',
    'Header-CurTime':'',
    'Header-UserId':'',
    'Cookie':'token',
});

### serverApi

配置服务器域名列表，每个server对应dev，test，uat，producttion域名环境；

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

httpClient.requestAction(actionUrl.loginAction('zan','123456')); //发起请求
