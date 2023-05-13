<script setup>
import { ref, reactive, computed } from 'vue';
import { getCallLog, updateCallLog, newCallLog } from '../../services';
import { encryptPassword } from '../../utils';
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { formatTel } from '../../utils';
import Ws from '../../utils/ws';
import { wsHost, host } from '../../utils/request';

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

onShow(() => {
    getPageList(() => {}, true);
});

const getFileEntry = async (fileName, dirEntry) => {
    return new Promise(resolve => {
        plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
            let entry = dirEntry || fs.root;
            entry.getFile(
                fileName,
                {
                    create: true
                },
                function(fileEntry) {
                    console.log(fileEntry);
                    resolve(fileEntry);
                }
            );
        });
    });
};

const getDirEntry = async dirName => {
    return new Promise(async resolve => {
        plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
            fs.root.getDirectory(
                dirName,
                {
                    create: true
                },
                function(dirEntry) {
                    resolve(dirEntry);
                }
            );
        });
    });
};

const getFile = async (fileName, dirEntry) => {
    return new Promise(async resolve => {
        let fileEntry = await this.getFileEntry(fileName, dirEntry);
        fileEntry.file(function(file) {
            console.log(file);
            resolve(file);
        });
    });
};

onLoad(async function() {
    let startTime = 0;
    let endTime = 0;
    uni.connectSocket({
        url: `${wsHost}/webSocket/${uni.getStorageSync('userId')}`
    });
    uni.onSocketMessage(function(message) {
        console.log(message);
        const data = JSON.parse(message.data);
        if (data.msg) {
            const msg = JSON.parse(data.msg);
            if (msg.code === 'call') {
                handleCall({
                    phone: msg.content.customer.phone,
                    type: 'update',
                    id: msg.content.id
                });
            }
        }
    });

    recorderManager.onStop(function(res) {
        console.log('record' + JSON.stringify(res));
        // endTime.value = Math.round(new Date().getTime() / 1000);
        endTime = Math.round(new Date().getTime() / 1000);
        uni.showToast({
            icon: 'loading',
            title: '保存录音中,请稍后...',
            duration: 2000
        });
        plus.io.resolveLocalFileSystemURL(
            '/storage/emulated/0/MIUI/sound_recorder/call_rec', //小米手机录音存放位置
            function(entry) {
                console.log(entry.name);
                var directoryReader = entry.createReader(); //获取读取目录对象
                directoryReader.readEntries(
                    function(entries) {
                        uni.uploadFile({
                            url: `${host}/api/localStorage`,
                            // files: ['/MIUI/sound_recorder/call_rec/15882033521(15882033521)_20230506192735.mp3'],
                            filePath: entries[entries.length - 1].fullPath,
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
                                console.log(callType.value);
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
                                        });
                                }
                            },
                            fail(err) {
                                console.log('上传文件失败');
                                uni.showToast({
                                    title: '上传文件失败'
                                });
                            },
                            complete() {
                                uni.hideToast();
                            }
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
                    break;
                case 1:
                    console.log('1、振铃状态');
                    break;
                case 2:
                    console.log('2、通话存在');
                    // startTime.value = Math.round(new Date().getTime() / 1000);
                    startTime = Math.round(new Date().getTime() / 1000);
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

const handleCall = params => {
    const { phone, type, id } = params;
    plus.device.dial(phone, false);
    callType.value = type;
    callId.value = id;
    console.log(params.customerId);
    customerId.value = params.customerId;
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
onPullDownRefresh(() => {
    page.value = 1;
    status.value = 'more';
    setTimeout(() => {
        getPageList(() => {
            uni.stopPullDownRefresh();
        }, true);
    });
});
const handleMore = () => {
    if (status.value !== 'loading' && status.value !== 'noMore') {
        page.value += 1;
        status.value = 'loading';
        getPageList(() => {
            status.value = 'more';
        });
    }
};
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
