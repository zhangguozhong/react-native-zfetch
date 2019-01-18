const storageTask = {
    //保存已发起的网络请求，用于cancel掉网络请求；
    tasks:{},
    setTask: function (promise, pageId) {
        if (!pageId) {
            return;
        }
        if (!this.tasks[pageId]) {
            this.tasks[pageId] = [];
        }
        this.tasks[pageId].push(promise);
    },
    getTasks:function (pageId) {
        if (!pageId) {
            return [];
        }
        return this.tasks[pageId];
    }
};

export default storageTask;