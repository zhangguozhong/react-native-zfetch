import requestHeaders from "./requestHeaders";

const configHeader = {
    //配置header信息，token也可以通过此处进行设置
    setHeaders: function (headers) {
        Object.assign(requestHeaders, headers);
    }
};

export default configHeader;