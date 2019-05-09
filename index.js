import RNFetchBlob from 'rn-fetch-blob';
import ServerUtil from './ServerUtil';
import HeaderFieldValueDictionary from './HeaderFieldValueDictionary';
const RNFS = require('react-native-fs');

let responseAdapter = null; //response适配器预处理请求返回数据
let responseInterceptor = null; //拦截器处理特定的业务逻辑
const defaultObject = { success:false,message:'网络请求失败,请重试',data:null };
const defaultServerNull = { success:false,message:'服务器serverApi或currentEnv没有配置',data:null };
const defaultTimeout = 15000;
const allPromise = {}; //所有promise网络请求

const httpClient = {

    downloadFile: async function(action,progressCallback = null,callback = null) {
        try{
            const { fileName,appendExt,apiUrl,headers } = action;
            const destination = RNFS.TemporaryDirectoryPath + fileName + appendExt;
            let options = {
                fromUrl: apiUrl,
                toFile: destination,
                headers:headers,
                progress: (data) => { executeCallback(progressCallback,data); },
                background:true,
                progressDivider:1
            };

            await RNFS.downloadFile(options).promise;
            const statResult = await RNFS.stat(destination);
            executeCallback(callback,responseAdapter? responseAdapter.handlerData(statResult, action) :statResult);
        }catch(e) {
            executeCallback(callback,defaultObject);
        }
    },

    requestAction:function (action,callback = null) {
        if (!action) {
            executeCallback(callback,defaultObject);
            return;
        }

        const { apiUrl } = action;
        let requestUrl = checkApiUrl(apiUrl) ? apiUrl: ServerUtil.serverUrl(action);
        if (!requestUrl) {
            executeCallback(callback,defaultServerNull);
            return;
        }

        const { method,params,header,timeout,pageName } = action;
        const requestMethod = method ? method :'POST';
        const apiParams = !params ?null: params;
        const requestTimeout = !timeout ?defaultTimeout: timeout; //网络请求超时时间
        let headers = Object.assign({}, HeaderFieldValueDictionary, !header? {}:header); //配置请求头

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
                }
                else {
                    requestParams = JSON.stringify(apiParams);
                }
            }
        }


        const fetchPromise = RNFetchBlob.config({trusty: true, timeout: requestTimeout})
            .fetch(requestMethod, requestUrl, headers, requestParams);
        fetchPromise.then((resp) => {
            return resp.json();
        }).then((json) => {
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
        const promiseInPage = allPromise[pageName];
        if (Array.isArray(promiseInPage) && promiseInPage.length > 0) {
            for (let cancelPromise of promiseInPage) {
                cancelPromise.cancel();
            }
            allPromise[pageName] = [];
        }
    }
};

function executeCallback(callback,data) { callback && callback(data); }

function storagePromiseInPage(pageName,fetchPromise) {
    if (!pageName) { return; }
    if (Object.keys(allPromise).indexOf(pageName) === -1) {
        allPromise[pageName] = [];
    }

    allPromise[pageName].push(fetchPromise);
}

function getRequestUrl(requestUrl,apiParams) {
    if (isEmptyObject(apiParams)) {
        return requestUrl;
    }

    const regular = new RegExp('{[a-zA-Z0-9]*}','g');
    const matchResult = requestUrl.match(regular);
    if (matchResult) {
        for (let string of matchResult) {
            let key = string.replace('{','');
            key = key.replace('}','');
            requestUrl = requestUrl.replace(string, apiParams[key]);
            delete apiParams[key];
        }
    }

    const tempParams = [];
    if (!isEmptyObject(apiParams)) {
        for (let key of Object.keys(apiParams)) {
            const param = key + '=' + apiParams[key];
            tempParams.push(param);
        }
    }
    return encodeURI(tempParams.length === 0 ? requestUrl :(requestUrl + '?' + tempParams.join('&')));
}

function isEmptyObject(object) {
    return !object || Object.keys(object).length === 0;
}

function checkApiUrl(apiUrl) {
    const regular = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    return regular.test(apiUrl);
}

export default httpClient;