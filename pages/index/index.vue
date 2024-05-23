<script setup>
import { ref } from 'vue';
import { onLoad, onPullDownRefresh, onShow, onHide } from '@dcloudio/uni-app';
import Ws from '../../utils/ws';
import { getCallLog, updateCallLog, newCallLog } from '../../services';
import { formatTel } from '../../utils';
import { wsHost, host } from '../../utils/request';

let ws = null;
let recorderManager = uni.getRecorderManager();
const oldEntries = ref([]);
const status = ref('more');
const records = ref([]);
const page = ref(1);
const size = 200;
const enableCall = ref(true);
const callId = ref();

const clearUniStatus = () => {
    uni.showToast({ title: '录音录制失败!' });
    uni.hideLoading();
    enableCall.value = true;
};

// 拨打手机
const handleCall = message => {
    console.log('***拨号***');
    enableCall.value = false;
    const data = JSON.parse(message.data);
    if (data.msg) {
        const msg = JSON.parse(data.msg);
        if (msg.code === 'call') {
            const phone = msg.content.customer.phone;
            callId.value = msg.content.id;
            plus.io.resolveLocalFileSystemURL(
                '/storage/emulated/0/MIUI/sound_recorder/call_rec', //小米手机录音存放位置
                function(entry) {
                    var directoryReader = entry.createReader(); //获取读取目录对象
                    directoryReader.readEntries(
                        entries => {
                            oldEntries.value = entries;
                            plus.device.dial(phone, false);
                        },
                        err => {
                            oldEntries.value = [];
                            plus.device.dial(phone, false);
                        }
                    );
                },
                function(err) {
                    oldEntries.value = [];
                    plus.device.dial(phone, false);
                    console.log('访问指定目录失败:' + err.message);
                    console.log(err);
                }
            );
        }
    }
};

// 监控录音结束
const onRecorderManagerStop = () => {
    recorderManager.onStop(res => {
        console.log('***录音结束***', res);
        uni.showLoading({ title: '上传录音中...' });

        plus.io.resolveLocalFileSystemURL(
            '/storage/emulated/0/MIUI/sound_recorder/call_rec', //小米手机录音存放位置
            entry => {
                console.log('***开始上传***');
                const directoryReader = entry.createReader();
                directoryReader.readEntries(entries => {
                    console.log('***文件列表***', entries);
                    if (entries.length === oldEntries.value.length) {
                        clearUniStatus();
                        return;
                    }

                    let currentRecord;
                    for (let item of entries) {
                        if (!oldEntries.value.find(recordItem => recordItem.name === item.name)) {
                            currentRecord = item;
                            break;
                        }
                    }

                    if (!currentRecord) {
                        clearUniStatus();
                        return;
                    }

                    // 上传文件
                    uni.uploadFile(
                        {
                            url: `${host}/api/localStorage`,
                            filePath: currentRecord.fullPath,
                            name: 'file',
                            header: {
                                authorization: uni.getStorageSync('token')
                            },
                            success: response => {
                                const res = JSON.parse(response.data);
                                const filePath = `/file/${res.type}/${res.realName}`;
                                updateCallLog({
                                    filePath,
                                    id: callId.value
                                })
                                    .then(() => {
                                        console.log('新增通话记录成功');
                                    })
                                    .catch(err => {
                                        console.log(JSON.stringify(err));
                                    })
                                    .then(() => {
                                        uni.hideLoading();
                                        getPageList(() => {}, true);
                                        enableCall.value = true;
                                    });
                            },
                            fail: err => {
                                clearUniStatus();
                                console.log(err);
                            }
                        },
                        err => {
                            clearUniStatus();
                            console.log(err);
                        }
                    );
                });
            },
            err => {
                clearUniStatus();
                console.log(err);
            }
        );
    });
};

// 监控手机通话状态
const onPhoneStatus = () => {
    let runtimeMainActivity = plus.android.runtimeMainActivity();
    let Contexttest = plus.android.importClass('android.content.Context');
    let telephonyManager = plus.android.importClass('android.telephony.TelephonyManager');
    let telManager = plus.android.runtimeMainActivity().getSystemService(Contexttest.TELEPHONY_SERVICE);
    let receiver = plus.android.implements('io.dcloud.android.content.BroadcastReceiver', {
        onReceive: function(Contexttest, intent) {
            plus.android.importClass(intent);
            //电话状态 0->空闲状态 1->振铃状态 2->通话存在
            let phoneStatus = telManager.getCallState();
            switch (phoneStatus) {
                case 0:
                    console.log('0、结束录音');
                    recorderManager.stop();
                    break;
                case 1:
                    console.log('1、振铃状态');
                    break;
                case 2:
                    console.log('2、通话存在');
                    recorderManager.start({
                        duration: 600000 // 时长 10分钟
                    });
                    break;
                default:
                    break;
            }
        }
    });

    let IntentFilter = plus.android.importClass('android.content.IntentFilter');
    let filter = new IntentFilter();
    filter.addAction(telephonyManager.ACTION_PHONE_STATE_CHANGED);
    runtimeMainActivity.registerReceiver(receiver, filter);
};

const closeSocket = () => {
    if (!ws) return;
    ws.close();
    ws = null;
};
// 开始建立连接
const connectSocket = () => {
    ws = new Ws({
        // 连接websocket所需参数
        data: {},
        // 首次连接成功/断线重新连接后触发（防止断线期间对方发送消息未接收到）
        onConnected: () => {},
        // 监听接收到服务器消息
        onMessage: e => {
            if (enableCall.value) {
                handleCall(e);
            }
            console.log('收到消息', e);
            // 监听服务端推送给你的新数据，然后更新到页面上
            // ... doSth
        }
    });
};

const handleMore = () => {
    if (status.value !== 'loading' && status.value !== 'noMore') {
        page.value += 1;
        status.value = 'loading';
        getPageList(() => {
            status.value = 'more';
        });
    }
};

const getPageList = async (onSuccess, isFrefresh) => {
    const res = await getCallLog({
        page: page.value,
        size
    });
    console.log(res);
    if (isFrefresh) {
        records.value = res.content;
    } else {
        records.value = [...records.value, ...res.content];
    }

    if (onSuccess) {
        onSuccess();
    }
    if (page.value * size > res.totalElements) {
        status.value = 'noMore';
    }
};

onShow(async () => {
    console.log('***show***');
    enableCall.value = true;
    connectSocket();
    getPageList(() => {}, true);
});

onHide(async () => {
    console.log('***hide***');
    closeSocket();
    // runtimeMainActivity = null;
    // recorderManager.offStop();
    // recorderManager = null;
});

onLoad(async () => {
    onPhoneStatus();
    onRecorderManagerStop();
});

onPullDownRefresh(() => {
    page.value = 1;
    status.value = 'more';
    setTimeout(() => {
        getPageList(() => {
            uni.stopPullDownRefresh();
        }, true);
    });
});
</script>
<template>
    <view class="container">
        <view>{{ filePathRes }}</view>
        <scroll-view scroll-y>
            <uni-list>
                <uni-list-item v-for="item in records" :key="item.id" :title="item?.customer.customeName" :note="formatTel(item?.customer.phone)" showArrow thumb-size="lg">
                    <template v-slot:footer>
                        <view>
                            <view class="chat-custom-right">{{ item.callTime }}</view>
                            <!-- 需要使用 uni-icons 请自行引入 -->
                            <view class="chat-custom-right">{{ item.callTimeLength }}秒</view>
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            <uni-load-more v-if="records.length > 0" :status="status" :contentText="contentText" @click="handleMore" />
        </scroll-view>
    </view>
</template>
<style lang="less" scoped>
.chat-custom-right {
    color: #999;
    text-align: right;
}
</style>
