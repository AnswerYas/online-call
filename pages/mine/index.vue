<script setup>
import { getUserInfo } from "../../services";
import { onShow } from "@dcloudio/uni-app";
import { ref, reactive, computed } from "vue";
import { hostname } from "../../utils/request";

const userInfo = ref({});

onShow(async () => {
    userInfo.value = await getUserInfo();
});
</script>
<template>
    <view class="container">
        <view class="avatar-container uni-pl-5 uni-pb-5">
            <image
                :src="`${hostname}${userInfo?.user?.avatarPath}`"
                class="avatar"
            />
            <view class="uni-ml-10">{{ userInfo?.user?.nickName }}</view>
        </view>
        <view class="statistic-total uni-mt-5">
            <uni-row>
                <uni-col :span="8"> </uni-col>
                <uni-col :span="8"></uni-col>
                <uni-col :span="8"></uni-col>
            </uni-row>
        </view>
        <view class="statistic-total uni-mt-5">
            <un-list>
                <uni-list-item
                    title="本周通话个数"
                    thumb="../../assets/img/phone-blue.png"
                    thumb-size="lg"
                    rightText="65"
                />
                <uni-list-item
                    title="本周通话时长"
                    thumb="../../assets/img/time-blue.png"
                    thumb-size="lg"
                    rightText="65分钟"
                />
                <uni-list-item
                    title="本周平均通话时长"
                    thumb="../../assets/img/time-avarge-blue.png"
                    thumb-size="lg"
                    rightText="65分钟"
                />
                <uni-list-item
                    title="本月通话个数"
                    thumb="../../assets/img/phone.png"
                    thumb-size="lg"
                    rightText="65"
                />
                <uni-list-item
                    title="本月通话时长"
                    thumb="../../assets/img/time.png"
                    thumb-size="lg"
                    rightText="65分钟"
                />
                <uni-list-item
                    title="本月平均通话时长"
                    thumb="../../assets/img/time-avarge.png"
                    thumb-size="lg"
                    rightText="65分钟"
                />
            </un-list>
        </view>
        <view class="uni-mt-5 block-item">
            <uni-icons type="trash" color="#e43d33" size="18" />
            <text>清空录音文件</text>
        </view>
        <view class="uni-mt-5 block-item">
            <text>退出登录</text>
        </view>
    </view>
</template>
<style lang="scss" scoped>
.avatar-container {
    display: flex;
    align-items: center;
    background-color: #fff;
}
.avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
}
.block-item {
    text-align: center;
    background-color: #fff;
    height: 40px;
    line-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e43d33
}
</style>
