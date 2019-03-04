import serverEnv from './serverApi/serverEnv';
import allEnv from './serverApi/serverApi';

const defaultServerUrl = null; //服务器地址未配置
const UtilsServer = {
    serverUrl: function (action) {
        const { server,apiUrl } = action;
        if (notConfigServer(allEnv) || !allEnv[server] || !serverEnv.currentEnv) {
            return defaultServerUrl;
        }

        let serverApi = allEnv[server][serverEnv.currentEnv];
        return serverApi + apiUrl;
    }
};

function notConfigServer(allEnv) {
    return Object.keys(allEnv).length === 0;
}

export default UtilsServer;