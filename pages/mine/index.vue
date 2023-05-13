<script setup>
import { getUserInfo, getUserCallStatistics } from "../../services";
import { onShow } from "@dcloudio/uni-app";
import { ref, reactive, computed } from "vue";
import { hostname } from "../../utils/request";

const userInfo = ref({});
const userCallStatistics = ref({});

onShow(async () => {
    userInfo.value = await getUserInfo();
    userCallStatistics.value = await getUserCallStatistics();
});
const handleLogout = () => {
    uni.reLaunch({
        url: "/pages/login/index",
    });
    uni.removeStorageSync("token");
};
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
        <view class="statistic-day uni-mt-5 uni-pt-10 uni-pb-10">
            <uni-row>
                <uni-col :span="8">
                    <view class="num">{{
                        userCallStatistics?.day?.callCount
                    }}</view>
                    <view>通话个数</view>
                </uni-col>
                <uni-col :span="8">
                    <view class="num"
                        >{{ userCallStatistics?.day?.callTime }}分钟</view
                    >
                    <view>通话时长</view>
                </uni-col>
                <uni-col :span="8">
                    <view class="num"
                        >{{ userCallStatistics?.day?.avgCallTime }}分钟</view
                    >
                    <view>平均通话时长</view>
                </uni-col>
            </uni-row>
        </view>
        <view class="statistic-total uni-mt-5">
            <un-list>
                <uni-list-item
                    title="本周通话个数"
                    thumb="../../static/phone-blue.png"
                    thumb-size="lg"
                    :rightText="`${userCallStatistics?.week?.callCount}`"
                />
                <uni-list-item
                    title="本周通话时长"
                    thumb="../../static/time-blue.png"
                    thumb-size="lg"
                    :rightText="`${userCallStatistics?.week?.callTime}分钟`"
                />
                <uni-list-item
                    title="本周平均通话时长"
                    thumb="../../static/time-avarge-blue.png"
                    thumb-size="lg"
                    :rightText="`${userCallStatistics?.week?.avgCallTime}分钟`"
                />
                <uni-list-item
                    title="本月通话个数"
                    thumb="../../static/phone.png"
                    thumb-size="lg"
                    :rightText="`${userCallStatistics?.total?.callCount}`"
                />
                <uni-list-item
                    title="本月通话时长"
                    thumb="../../static/time.png"
                    thumb-size="lg"
                    :rightText="`${userCallStatistics?.total?.avgCallTime}分钟`"
                />
                <uni-list-item
                    title="本月平均通话时长"
                    thumb="../../static/time-avarge.png"
                    thumb-size="lg"
                    :rightText="`${userCallStatistics?.total?.avgCallTime}分钟`"
                />
            </un-list>
        </view>
        <view class="uni-mt-5 block-item">
            <uni-icons type="trash" color="#e43d33" size="18" />
            <text>清空录音文件</text>
        </view>
        <view class="uni-mt-5 block-item">
            <text @click="handleLogout">退出登录</text>
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
    color: #e43d33;
}
.statistic-day {
    background-color: #fff;
    text-align: center;
    .num {
        font-size: 18px;
        line-height: 32px;
    }
}
</style>
