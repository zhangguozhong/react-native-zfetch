import { Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import CookieManager from 'react-native-cookies';
import UtilsServer from './UtilsServer';
import requestHeaders from './requestHeaders';

let responseAdapter = null; //response适配器预处理请求返回数据
let responseInterceptor = null; //拦截器处理特定的业务逻辑
const defaultObject = { success:false,message:'网络请求失败,请重试',data:null };
const defaultServerNull = { success:false,message:'服务器serverApi或currentEnv没有配置',data:null };
const defaultTimeout = 15000;

const httpClient = {
    allPromise:{},
    requestAction:function (action,callback = null) {
        if (!action) {
            callback && callback(defaultObject);
            return;
        }
        const { apiUrl } = action;
        let requestUrl = checkApiUrl(apiUrl) ? apiUrl: UtilsServer.serverUrl(action);
        if (!requestUrl) {
            executeCallback(callback,defaultServerNull);
            return;
        }

        const { method,params,header,timeout,pageName } = action;
        const requestMethod = method ? method :'POST';
        const apiParams = params ? params :null;
        const requestTimeout = timeout ? timeout : defaultTimeout; //网络请求超时时间
        let headers = Object.assign({}, requestHeaders, !header? {}:header); //配置请求头

        let requestParams = null;
        if (apiParams && Array.isArray(apiParams)) {
            headers = Object.assign({},headers,{'Content-Type': 'multipart/form-data'});
            requestParams = apiParams;
        }
        else {
            headers = Object.assign({},headers,{'Content-Type': 'application/json'});
            if (apiParams) {
                if (requestMethod === 'GET') {
                    requestUrl = getRequestUrl(requestUrl,apiParams);
                }else {
                    requestParams = JSON.stringify(apiParams);
                }
            }
        }

        const { clearAll } = CookieManager;
        if (Platform.OS === 'android') {
            clearAll();
        }

        const fetchPromise = RNFetchBlob.config({trusty: true, timeout: requestTimeout})
            .fetch(requestMethod, requestUrl, headers, requestParams);
        fetchPromise.then((resp) => {
            return resp.json();
        }).then((json) => {
            //1、拦截器目前用于拦截token过期判断；2、还可以用于json格式处理
            if (responseInterceptor) {
                if (responseInterceptor.interceptResponse(json,action)) {
                    return;
                }
            }

            executeCallback(callback,responseAdapter? responseAdapter.handlerData(json,action): json);

        }).catch((error) => {
            executeCallback(callback,defaultObject);
        });

        storagePromiseInPage(pageName,fetchPromise);
        return fetchPromise;
    },
    registerAdapter:function (adapter) {
        responseAdapter = adapter;
    },
    registerResponseInterceptor:function (interceptor) {
        responseInterceptor = interceptor;
    },
    cancelRequestInPage:function (pageName) {
        if (!pageName) {
            return;
        }
        const promiseInPage = this.allPromise[pageName];
        if (Array.isArray(promiseInPage) && promiseInPage.length > 0) {
            for (let cancelPromise of promiseInPage) {
                cancelPromise.cancel();
            }
            this.allPromise[pageName] = [];
        }
    }
};

function executeCallback(callback,data) {
    callback && callback(data);
}

function storagePromiseInPage(pageName,fetchPromise) {
    if (!pageName) {
        return;
    }
    if (Object.keys(httpClient.allPromise).indexOf(pageName) === -1) {
        httpClient.allPromise[pageName] = [];
    }
    httpClient.allPromise[pageName].push(fetchPromise);
}

function getRequestUrl(requestUrl,apiParams) {
    if (!apiParams || Object.keys(apiParams).length === 0) {
        return requestUrl;
    }
    const arrTemp = [];
    for (let key of Object.keys(apiParams)) {
        let param = key + '=' + apiParams[key];
        arrTemp.push(param);
    }

    const encodeUrl = requestUrl + '?' + arrTemp.join('&');
    return encodeURI(encodeUrl);
}

function checkApiUrl(apiUrl) {
    const Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    const objExp = new RegExp(Expression);
    return objExp.test(apiUrl);
}

export default httpClient;