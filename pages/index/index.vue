<script setup>
import { ref, reactive, computed } from "vue";
import { getCallLog } from "../../services";
import { encryptPassword } from "../../utils";
import { onLoad, onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import { formatTel } from "../../utils";

const records = ref([]);
const page = ref(1);
const size = 200;
const status = ref("more");

const contentText = { contentdown: "点击加载更多" };

onShow(() => {
    getPageList(() => {}, true);
});

const getPageList = async (onSuccess, isFrefresh) => {
    const res = await getCallLog({
        page: page.value,
        size,
    });
    if (isFrefresh) {
        records.value = res.content;
    } else {
        records.value = [...records.value, ...res.content];
    }

    if (onSuccess) {
        onSuccess();
    }
    if (page.value * size > res.totalElements) {
        status.value = "noMore";
    }
};
onPullDownRefresh(() => {
    page.value = 1;
    status.value = "more";
    setTimeout(() => {
        getPageList(() => {
            uni.stopPullDownRefresh();
        }, true);
    });
});
const handleMore = () => {
    if (status.value !== "loading" && status.value !== "noMore") {
        page.value += 1;
        status.value = "loading";
        getPageList(() => {
            status.value = "more";
        });
    }
};
</script>
<template>
    <view class="container">
        <scroll-view scroll-y>
            <uni-list>
                <uni-list-item
                    v-for="item in records"
                    :key="item.id"
                    :title="item?.customer.customeName"
                    :note="formatTel(item?.customer.phone)"
                    showArrow
                    thumb-size="lg"
                >
                    <template v-slot:footer>
                        <view>
                            <view class="chat-custom-right">{{
                                item.callTime
                            }}</view>
                            <!-- 需要使用 uni-icons 请自行引入 -->
                            <view class="chat-custom-right"
                                >{{ item.callTimeLength }}秒</view
                            >
                        </view>
                    </template>
                </uni-list-item>
            </uni-list>
            <uni-load-more
                v-if="records.length > 0"
                :status="status"
                :contentText="contentText"
                @click="handleMore"
            />
        </scroll-view>
    </view>
</template>
<style lang="less" scoped>
.chat-custom-right {
    color: #999;
    text-align: right;
}
</style>
