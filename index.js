import RNFetchBlob from 'rn-fetch-blob';
import CookieManager from 'react-native-cookies';
import getServerUrl from "./getServerUrl";
import requestHeaders from './requestHeaders';
import globalMethod from "./globalMethod";
const RNFS = require('react-native-fs');

let responseAdapter = null; //response适配器预处理请求返回数据
let responseInterceptor = null; //拦截器处理特定的业务逻辑
const defaultObject = { success:false, message:'网络请求失败,请重试', data:null };
const defaultServerNull = { success:false, message:'服务器serverApi或currentEnv没有配置', data:null };
const defaultTimeout = 15000;

const httpClient = {
    allPromise:{},
    downloadFile: async function(action,progressCallback = null,callback = null) {
        try{
            const { fileName,appendExt,apiUrl,headers } = action;
            const destination = RNFS.TemporaryDirectoryPath + fileName + appendExt;
            let options = {
                fromUrl: apiUrl,
                toFile: destination,
                headers:headers,
                progress: (data) => { progressCallback && progressCallback(data); },
                background:true,
                progressDivider:1
            };

            await RNFS.downloadFile(options).promise;
            const statResult = await RNFS.stat(destination);

            let filePackage = statResult;
            if (responseAdapter) {
                filePackage = responseAdapter.handlerData(statResult, action);
            }
            callback && callback(filePackage);
        }catch(e) {
            if (callback) {
                callback(defaultObject);
            }
        }
    },
    requestAction: function (action,callback = null) {
        if (!action) {
            callback && callback(defaultObject);
            return;
        }
        const { apiUrl } = action;
        let requestUrl = null;
        if (checkApiUrl(apiUrl)) {
            requestUrl = apiUrl;
        }else {
            requestUrl = getServerUrl.serverUrl(action);
        }
        if (!requestUrl) {
            callback && callback(defaultServerNull);
            return;
        }

        const { method,params,header,timeout,pageName } = action;
        let requestMethod = method ? method :'POST';
        let apiParams = params ? params :null;
        let requestTimeout = timeout ? timeout : defaultTimeout; //网络请求超时时间
        let headers = Object.assign({}, requestHeaders); //配置请求头
        if (header) {
            headers = Object.assign({}, headers, header);
        }

        let requestParams = null;
        if (apiParams && Array.isArray(apiParams)) {
            headers = Object.assign({},headers,{'Content-Type': 'multipart/form-data'});
            requestParams = apiParams;
        }else {
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
        if (globalMethod.hasAndroid()) {
            clearAll();
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

    let encodeUrl = requestUrl + '?' + arrTemp.join('&');
    return encodeURI(encodeUrl);
}

function checkApiUrl(apiUrl) {
    let Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    let objExp = new RegExp(Expression);
    return objExp.test(apiUrl);
}

export default httpClient;