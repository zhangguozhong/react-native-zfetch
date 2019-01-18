import serverEnv from "./serverEnv";
import allEnv from "./serverApi/serverApi";

const defaultServerUrl = null; //域名地址未配置
const getServerUrl = {

    serverUrl: function (action) {
        const { server,apiUrl } = action;
        if (notConfigServer(allEnv) || !serverEnv.currentEnv) {
            //没有配置serverApi以及currentEnv，返回null
            return defaultServerUrl;
        }

        let serverApi = allEnv[server][serverEnv.currentEnv];
        return serverApi + apiUrl;
    }
};

function notConfigServer(allEnv) {
    return Object.keys(allEnv).length === 0;
}

export default getServerUrl;