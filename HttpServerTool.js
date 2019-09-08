import serverEnvironment from './config/serverEnvironment';
import JsonTool from './JsonTool';
import serverDomain from './config/serverDomain';

const HttpServerTool = {

    urlStringOfRequestAction: function (action) {
        const {server, apiUrl} = action;
        if (!apiUrl) {
            return {urlString: null, error: {success:false, message:'apiUrl为空', data:null}};
        }
        if (checkApiUrl(apiUrl)) {
            return {urlString: apiUrl, error:{}};
        }
        if (JsonTool.isEmptyObject(serverDomain) || !serverDomain[server] || !serverEnvironment.currentEnvironment) {
            return {urlString: null, error:{success:false, message:'请检查服务器配置', data:null}};
        }

        const requestUrl = serverDomain[server][serverEnvironment.currentEnvironment] + apiUrl;
        return {urlString: requestUrl, error:{}} ;
    }
};

function checkApiUrl(apiUrl) {
    const regular = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    return regular.test(apiUrl);
}

export default HttpServerTool;