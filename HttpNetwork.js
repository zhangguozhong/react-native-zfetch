import RNFetchBlob from 'rn-fetch-blob';
import HttpServerTool from './HttpServerTool';
import HeaderFieldValueDictionary from './HeaderFieldValueDictionary';
import JsonTool from './JsonTool';
import serverInterceptor from './config/serverInterceptor';
const defaultTimeout = 30000;

class FetchHandlers {

    constructor() {
        this.fetchPromise = [];
    }

    addFetch = (action, handler) => {
        this.fetchPromise.push({
            action:action,
            handler:handler
        });
    };

    removeFetch = (action) => {
        for (let object of this.fetchPromise) {
            if (object.action === action) {
                this.fetchPromise.remove(object);
                break;
            }
        }
    };

    cancelFetch = (actions) => {
        for (let action of actions) {
            for (let object of this.fetchPromise) {
                if (object.action === action) {
                    if (object.handler) {
                        object.handler.cancel();
                    }
                    this.fetchPromise.remove(object);
                    break;
                }
            }
        }
    };
}


class HttpNetwork {

    constructor() {
        this.fetchhandler = new FetchHandlers();
    }

    requestAction = (action, callback = () => {}) => {
        if (JsonTool.isEmptyObject(action)) {
            executeCallback(callback, {success:false, message:'请求对象为空', data:{}});
            return;
        }

        const requestObject = HttpServerTool.urlStringOfRequestAction(action);
        const {urlString, error} = requestObject;
        let requestUrl = urlString;
        if (!requestUrl) {
            executeCallback(callback, error);
            return;
        }

        const {method, params, header, timeout} = action;
        const requestMethod = method ? method : 'POST';
        const apiParams = !params ? null: params;
        const requestTimeout = !timeout ? defaultTimeout : timeout; //网络请求超时时间

        const headerFieldValueDictionary = HeaderFieldValueDictionary;
        if (header) {
            //配置请求头
            Object.assign(headerFieldValueDictionary, header);
        }

        let requestParams = null;
        if (apiParams && Array.isArray(apiParams)) {
            requestParams = apiParams;
        }
        else {
            if (apiParams) {
                if (requestMethod === 'GET') {
                    requestUrl = getRequestUrl(requestUrl,apiParams);
                }
                else {
                    requestParams = JSON.stringify(apiParams);
                }
            }
        }

        const fetchPromise = RNFetchBlob.config({trusty:true, timeout:requestTimeout})
            .fetch(requestMethod, requestUrl, headerFieldValueDictionary, requestParams);
        fetchPromise.then((resp) => {
            return resp.json();
        }).then((json) => {
            const { server } = action;
            const currentInterceptor = serverInterceptor[server];

            if (currentInterceptor) {
                if (currentInterceptor.interceptorResponse) {
                    const { isIntercept, error } = currentInterceptor.interceptorResponse(json, action);
                    if (isIntercept) {
                        executeCallback(callback, error);
                        return;
                    }
                }

                if (currentInterceptor.handlerResponseData) {
                    const resultData = currentInterceptor.handlerResponseData(json);
                    executeCallback(callback, resultData);
                }
                else {
                    executeCallback(callback, json);
                }
            }
            else {
                executeCallback(callback, json);
            }

        }).catch((error) => {
            executeCallback(callback, {success:false, message:error.message, data:{}});
        });

        this.fetchhandler.addFetch(getApiName(action.apiUrl), fetchPromise);
        return fetchPromise;
    };

    cancelRequests = (requestList) => {
        if (!requestList || requestList.length === 0) {
            return;
        }
        this.fetchhandler.cancelFetch(requestList);
    };
}

function executeCallback(callback = () => {}, data) {
    callback(data);
}

function getApiName(apiUrl) {
    if (!apiUrl) {
        return '';
    }

    const pathComponents = apiUrl.split('/');
    return pathComponents[pathComponents.length - 1];
}

function getRequestUrl(requestUrl, apiParams) {
    if (JsonTool.isEmptyObject(apiParams)) {
        return requestUrl;
    }

    const regular = new RegExp('{[a-zA-Z0-9]*}','g');
    const matchResult = requestUrl.match(regular);
    if (matchResult) {
        for (let string of matchResult) {
            let strKey = string.replace('{','');
            strKey = strKey.replace('}','');
            requestUrl = requestUrl.replace(string, apiParams[strKey]);
            delete apiParams[strKey];
        }
    }

    const tempParams = [];
    if (!JsonTool.isEmptyObject(apiParams)) {
        for (let strKey of Object.keys(apiParams)) {
            const param = strKey + '=' + apiParams[strKey];
            tempParams.push(param);
        }
    }
    return encodeURI(tempParams.length === 0 ? requestUrl : (requestUrl + '?' + tempParams.join('&')));
}

export default new HttpNetwork();