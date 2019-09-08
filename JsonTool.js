
const JsonTool = {
    isEmptyObject:function (object) {
        return !object || JSON.stringify(object) === '{}';
    }
};

export default JsonTool;