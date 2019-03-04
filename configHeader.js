import requestHeaders from "./requestHeaders";

const configHeader = {
    setHeaders:function (headers) {
        Object.assign(requestHeaders, headers);
    }
};

export default configHeader;