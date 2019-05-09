import requestHeaders from "./requestHeaders";

const HeaderUtil = {
    setHeaders:function (headers) {
        Object.assign(requestHeaders, headers);
    }
};

export default HeaderUtil;