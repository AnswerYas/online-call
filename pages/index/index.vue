<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { getCallLog, updateCallLog, newCallLog } from '../../services';
import { encryptPassword } from '../../utils';
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { formatTel } from '../../utils';
import Ws from '../../utils/ws';
import { wsHost, host } from '../../utils/request';
import moment from 'moment';

const recorderManager = uni.getRecorderManager();
const innerAudioContext = uni.createInnerAudioContext();

const records = ref([]);
const page = ref(1);
const size = 200;
const status = ref('more');
const ws = ref();
const startTime = ref(0);
const endTime = ref(0);
const callStatus = ref();
const filePathRes = ref();
const contentText = { contentdown: '点击加载更多' };
const callType = ref();
const callId = ref();
const customerId = ref('');
const recordsStart = ref();
const onMessageCallId = ref();
const currentPhoneStatus = ref();
const currentPhone = ref();
const isWs = ref(false);

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

const handleCall = params => {
    isWs.value = true;
    plus.io.resolveLocalFileSystemURL(
        '/storage/emulated/0/MIUI/sound_recorder/call_rec', //小米手机录音存放位置
        function(entry) {
            var directoryReader = entry.createReader(); //获取读取目录对象
            directoryReader.readEntries(
                function(entries) {
                    for (let item of entries) {
                        console.log('***fullpath***' + item.fullPath);
                    }

                    recordsStart.value = entries;
                    const { phone, type, id } = params;
                    plus.device.dial(phone, false);
                    callType.value = type;
                    callId.value = id;
                    console.log(params.customerId);
                    console.log('***call***');
                    customerId.value = params.customerId;
                    currentPhone.value = phone;
                },
                function(err) {
                    console.log('访问目录失败:');
                    console.log(err);
                }
            );
        },
        function(err) {
            console.log('访问指定目录失败:' + err.message);
            console.log(err);
        }
    );
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

// uni.connectSocket({
//     url: `${wsHost}/webSocket/${uni.getStorageSync('userId')}`
// });

onShow(() => {
    console.log('***onshow***');
    getPageList(() => {}, true);
    console.log('***onload***');

    let startTime = 0;
    let endTime = 0;

    uni.connectSocket({
        url: `${wsHost}/webSocket/${uni.getStorageSync('userId')}`,
        success(res) {
            console.log('connect success');
        }
    });

    uni.onSocketOpen(function(res) {
        console.log('WebSocket连接已打开！');
    });
    uni.onSocketError(function(res) {
        console.log('WebSocket连接打开失败，请检查！');
    });
    uni.onSocketMessage(function(message) {
        console.log(message);
        const data = JSON.parse(message.data);
        if (data.msg) {
            const msg = JSON.parse(data.msg);
            if (msg.code === 'call') {
                console.log('***currentPhoneStatus***' + currentPhoneStatus.value);
                if (!isWs.value && currentPhoneStatus.value !== 1 && currentPhoneStatus.value !== 2) {
                    handleCall({
                        phone: msg.content.customer.phone,
                        type: 'update',
                        id: msg.content.id
                    });
                }
            }
        }
    });

    uni.onSocketClose(function(res) {
        console.log('WebSocket 已关闭！');
    });

    recorderManager.onStop(function(res) {
        // endTime.value = Math.round(new Date().getTime() / 1000);
        console.log('record' + JSON.stringify(res));
        endTime = Math.round(new Date().getTime() / 1000);
        const endRecordTime = new Date();
        console.log(endRecordTime);

        plus.io.resolveLocalFileSystemURL(
            '/storage/emulated/0/MIUI/sound_recorder/call_rec', //小米手机录音存放位置
            function(entry) {
                var directoryReader = entry.createReader(); //获取读取目录对象
                directoryReader.readEntries(
                    function(entries) {
                        if (entries.length === recordsStart.value.length) return;
                        let currentRecord;
                        for (let item of entries) {
                            if (!recordsStart.value.find(recordItem => recordItem.name === item.name)) {
                                currentRecord = item;
                                break;
                            }
                        }
                        if (!currentRecord) return;
                        console.log('***保存录音***');
                        uni.showLoading({
                            title: '保存录音中,请稍后...',
                            mask: true,
                            fail: () => {
                                console.log('loading失败');
                            },
                            success: () => {
                                console.log('loading成功');
                            }
                        });
                        uni.uploadFile({
                            url: `${host}/api/localStorage`,
                            filePath: currentRecord.fullPath,
                            name: 'file',
                            header: {
                                authorization: uni.getStorageSync('token')
                            },
                            success: response => {
                                console.log('上传成功' + JSON.stringify(response));
                                const res = JSON.parse(response.data);
                                const filePath = `/file/${res.type}/${res.realName}`;
                                let callTimeLength = 0;
                                // if (startTime.value && endTime.value) {
                                //     callTimeLength = endTime.value - startTime.value;
                                // }
                                if (startTime && endTime) {
                                    callTimeLength = endTime - startTime;
                                }
                                // if (currentPhone.value !== currentRecord.name.split('(')[0]) return;
                                if (callType.value === 'update') {
                                    updateCallLog({
                                        id: callId.value,
                                        callTimeLength,
                                        filePath
                                    })
                                        .then(() => {
                                            console.log('更新通话记录成功');
                                        })
                                        .catch(err => {
                                            console.log(JSON.stringify(err));
                                        })
                                        .then(() => {
                                            startTime = 0;
                                            endTime = 0;
                                            uni.hideLoading();
                                            isWs.value = false;
                                            getPageList(() => {}, true);
                                        });
                                } else {
                                    newCallLog({
                                        callTimeLength,
                                        filePath,
                                        customerId: customerId.value
                                    })
                                        .then(() => {
                                            console.log(customerId.value);
                                            console.log('新增通话记录成功');
                                        })
                                        .catch(err => {
                                            console.log(JSON.stringify(err));
                                        })
                                        .then(() => {
                                            startTime = 0;
                                            endTime = 0;
                                            uni.hideLoading();
                                            isWs.value = false;
                                            getPageList(() => {}, true);
                                        });
                                }
                            },
                            fail(err) {
                                console.log('上传文件失败');
                                uni.showToast({
                                    title: '上传文件失败'
                                });
                            },
                            complete() {}
                        });
                    },
                    function(err) {
                        console.log('访问目录失败:');
                        console.log(err);
                    }
                );
            },
            function(err) {
                console.log('访问指定目录失败:' + err.message);
                console.log(err);
            }
        );
    });

    let maintest = plus.android.runtimeMainActivity();
    let Contexttest = plus.android.importClass('android.content.Context');
    let telephonyManager = plus.android.importClass('android.telephony.TelephonyManager');
    let telManager = plus.android.runtimeMainActivity().getSystemService(Contexttest.TELEPHONY_SERVICE);
    let receiver = plus.android.implements('io.dcloud.android.content.BroadcastReceiver', {
        onReceive: function(Contexttest, intent) {
            plus.android.importClass(intent);
            let phoneStatus = telManager.getCallState();

            callStatus.value = phoneStatus; //电话状态 0->空闲状态 1->振铃状态 2->通话存在
            switch (phoneStatus) {
                case 0:
                    console.log('0、结束录音');
                    recorderManager.stop();
                    currentPhoneStatus.value = 0;
                    break;
                case 1:
                    console.log('1、振铃状态');
                    currentPhoneStatus.value = 1;
                    break;
                case 2:
                    console.log('2、通话存在');
                    // startTime.value = Math.round(new Date().getTime() / 1000);
                    startTime = Math.round(new Date().getTime() / 1000);
                    currentPhoneStatus.value = 2;
                    recorderManager.start({
                        duration: 600000 // 时长 10分钟
                    });
                    break;
            }
        }
    });

    let IntentFilter = plus.android.importClass('android.content.IntentFilter');
    let filter = new IntentFilter();
    filter.addAction(telephonyManager.ACTION_PHONE_STATE_CHANGED);
    maintest.registerReceiver(receiver, filter);
});

onLoad(async function() {});

onHide(async function() {
    uni.closeSocket();
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
                <uni-list-item
                    v-for="item in records"
                    :key="item.id"
                    :title="item?.customer.customeName"
                    :note="formatTel(item?.customer.phone)"
                    showArrow
                    thumb-size="lg"
                    :clickable="true"
                    @click="
                        () =>
                            handleCall({
                                phone: item?.customer.phone,
                                type: 'new',
                                customerId: item?.customer.id
                            })
                    "
                >
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
