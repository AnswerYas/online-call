// 心跳间隔、重连websocket间隔，5秒
import { wsHost } from "./request";

const interval = 5000;
// 重连最大次数
const maxReconnectMaxTime = 5;

export default class WS {
    constructor(options) {
        // 配置
        this.options = options;
        // WS实例
        this.socketTask = null;

        // 正常关闭
        this.normalCloseFlag = false;
        // 重新连接次数
        this.reconnectTime = 1;
        // 重新连接Timer
        this.reconnectTimer = null;
        // 心跳Timer
        this.heartTimer = null;

        // 发起连接
        this.initWS();

        // 关闭WS
        this.close = () =>
            new Promise((resolve) => {
                if (!this.socketTask) {
                    resolve(false);
                    return;
                }
                // 正常关闭状态
                this.normalCloseFlag = true;
                // 关闭websocket
                this.socketTask.close();
                // 关闭心跳定时器
                clearInterval(this.heartTimer);
                // 关闭重连定时器
                clearTimeout(this.reconnectTimer);

                this.socketTask = null;
                resolve(true);
            });
    }

    initWS() {
        this.socketTask = uni.connectSocket({
            url: `${wsHost}/webSocket/${uni.getStorageSync("userId")}`,
            success() {},
        });
        // 监听WS
        this.watchWS();
    }

    watchWS() {
        // 监听 WebSocket 连接打开事件
        this.socketTask.onOpen(() => {
            console.log("websocket连接成功！");
            // 连接成功
            this.options.onConnected();
            // 重置连接次数
            this.reconnectTime = 1;
            // 发送心跳
            this.onHeartBeat();
            // 监听消息
            this.onMessage();
            // 关闭Toast
            // uni.hideLoading();
        });

        // 监听websocket 错误
        this.socketTask.onError(() => {
            // 关闭并重连
            this.socketTask.close();
        });

        // 监听 WebSocket 连接关闭事件
        this.socketTask.onClose((res) => {
            console.log("websocket连接关闭");
            // 连接错误，发起重连接
            if (!this.normalCloseFlag) {
                this.onDisconnected(res);
            }
        });
    }

    // 监听消息
    onMessage() {
        // 监听websocket 收到消息
        this.socketTask.onMessage((res) => {
            // 收到消息
            if (res.data) {
                this.options.onMessage(res);
            } else {
                console.log("未监听到消息：原因：", JSON.stringify(res));
            }
        });
    }

    // 断开连接
    onDisconnected(res) {
        console.log("websocket断开连接，原因：", JSON.stringify(res));
        // 关闭心跳
        clearInterval(this.heartTimer);
        // 全局Toast提示，防止用户继续发送
        // uni.showLoading({ title: "消息收取中…" });
        // 尝试重新连接
        this.onReconnect();
    }

    // 断线重连
    onReconnect() {
        clearTimeout(this.reconnectTimer);
        if (this.reconnectTime < maxReconnectMaxTime) {
            this.reconnectTimer = setTimeout(() => {
                console.log(`第【${this.reconnectTime}】次重新连接中……`);
                this.initWS();
                this.reconnectTime++;
            }, interval);
        } else {
            // uni.hideLoading();
            // uni.showModal({
            //     title: "温馨提示",
            //     content: "服务器开小差啦~",
            //     showCancel: false,
            //     confirmText: "我知道了",
            //     success: () => {
            //         console.log("关闭弹窗");
            //     },
            // });
        }
    }

    /** @心跳 * */
    onHeartBeat() {
        this.heartTimer = setInterval(() => {
            this.socketTask.send({
                data: "heart：测试ing",
                success() {
                    console.log("心跳发送成功！");
                },
            });
        }, interval);
    }
}
