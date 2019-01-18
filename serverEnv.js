const serverEnv = {
    //设置当前环境，为什么要独立出来不直接放到httpClient里面，主要是因为预防其他模块也需要使用这个属性
    currentEnv:''
};

export default serverEnv;