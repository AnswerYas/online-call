export const host = "http://121.40.16.125:8100";
export const hostname = "http://121.40.16.125";
export const wsHost = "ws://121.40.16.125:8100"

export default (params) => {
    const { contentType = "application/json", method, url, data } = params;
    let token = uni.getStorageSync("token") || "";

    const requestUrl = `${host}${url}`;
    // uni.showLoading({ title: "加载中..." });
    return new Promise((resolve, reject) => {
        uni.request({
            url: requestUrl,
            method,
            data,
            header: {
                "Content-Type": contentType,
                Authorization: token,
            },
            success: (res) => {
                if (res?.statusCode === 200) {
                    resolve(res.data);
                } else if (res?.statusCode === 500) {
                    setTimeout(() => {
                        uni.showToast({
                            title: "服务器故障，请稍后重试",
                        });
                    });
                    reject(res);
                } else if (res?.statusCode === 401) {
                    uni.reLaunch({
                        url: "/pages/login/index",
                    });
                    uni.removeStorageSync("token");
                    reject(res);
                } else {
                    uni.showToast({
                        title: res.data.message,
                    });
                    reject(res);
                }
            },
            fail: (e) => {
                setTimeout(() => {
                    uni.showToast({
                        title: "服务器故障，请稍后重试",
                    });
                });
                reject(e.data);
            },
            complete: (e) => {
                // uni.hideLoading();
                resolve(e.data);
            },
        });
    });
};