import RNFetchBlob from 'rn-fetch-blob';
import { Platform } from 'react-native';
import CookieManager from 'react-native-cookies';
import getServerUrl from "./getServerUrl";
import requestHeaders from './requestHeaders';

let responseAdapter = null; //response适配器预处理请求返回数据
let responseInterceptor = null; //拦截器处理特定的业务逻辑
const defaultObject = {success:false, message:'网络请求失败,请重试', data:null};
const defaultServerNull = {success:false, message:'服务器serverApi或currentEnv没有配置', data:null};
const defaultTimeout = 15000;

const httpClient = {
    allPromise:{},

    requestAction: function (action, callback = null) {
        if (!action) {
            callback && callback(defaultObject);
            return;
        }
        let requestUrl = getServerUrl.serverUrl(action);
        if (!requestUrl) {
            callback && callback(defaultServerNull);
            return;
        }

        const { method,params,header,timeout,pageName } = action;
        let requestMethod = method ? method :'POST';
        let apiParams = params ? params :null;
        let requestTimeout = timeout ? timeout : defaultTimeout; //网络请求超时时间
        let headers = Object.assign({},requestHeaders); //配置请求头
        if (header) {
            headers = Object.assign({}, headers, header);
        }

        let requestParams = null;
        if (apiParams && Array.isArray(apiParams)) {
            requestParams = apiParams;
        }else {
            headers = Object.assign({}, headers, {'Content-Type':'application/json'});
            if (apiParams) {
                if (requestMethod === 'GET') {
                    requestUrl = getRequestUrl(requestUrl,apiParams);
                }else {
                    requestParams = JSON.stringify(apiParams);
                }
            }
        }
        if (Platform.OS === 'android') {
            //文件下载android设备cookies会导致文件下载失败，因此需清理cookies。
            CookieManager.clearAll();
        }


        let fetchPromise = RNFetchBlob.config({trusty: true, timeout: requestTimeout})
            .fetch(requestMethod, requestUrl, headers, requestParams);
        fetchPromise.then((resp) => {
            return resp.json();
        }).then((json) => {
            //1、拦截器目前用于拦截token过期判断；2、还可以用于json格式处理
            if (responseInterceptor) {
                if (responseInterceptor.interceptResponse(json, action)) {
                    return;
                }
            }

            let resultJson = json;
            if (responseAdapter) {
                resultJson = responseAdapter.handlerData(json, action);
            }

            if (callback) {
                callback(resultJson);
            }
        }).catch(() => {
            if (callback) {
                callback(defaultObject);
            }
        });

        storagePromiseInPage(pageName, fetchPromise); //按pageName保存当前component发起的网络请求
        return fetchPromise;
    },

    registerAdapter: function (adapter) {
        responseAdapter = adapter;
    },

    registerResponseInterceptor: function (interceptor) {
        responseInterceptor = interceptor;
    },

    cancelRequestInPage: function (pageName) {
        if (!pageName) {
            return;
        }
        let promiseInPage = this.allPromise[pageName];
        if (Array.isArray(promiseInPage) && promiseInPage.length > 0) {
            for (let cancelPromise of promiseInPage) {
                cancelPromise.cancel();
            }
            this.allPromise[pageName] = [];
        }
    }
};

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

    let arrTemp = [];
    for (let key of Object.keys(apiParams)) {
        let param = key + '=' + apiParams[key];
        arrTemp.push(param);
    }
    return requestUrl + '?' + arrTemp.join('&');
}

export default httpClient;