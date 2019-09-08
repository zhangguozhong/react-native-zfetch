import HeaderFieldValueDictionary from './HeaderFieldValueDictionary';

const HeaderUtil = {

    setHeaders: function (headers) {
        Object.assign(HeaderFieldValueDictionary, headers);
    }
};

export default HeaderUtil;