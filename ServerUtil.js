import serverEnv from './serverApi/serverEnv';
import allEnv from './serverApi/serverApi';

const ServerUtil = {

    serverUrl: function (action) {
        const { server,apiUrl } = action;
        if (notConfigServer(allEnv) || !allEnv[server] || !serverEnv.currentEnv) {
            return null;
        }

        const serverApi = allEnv[server][serverEnv.currentEnv];
        return serverApi + apiUrl;
    }
};

function notConfigServer(allEnv) { return Object.keys(allEnv).length === 0; }

export default ServerUtil;