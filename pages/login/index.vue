<script setup>
import { ref, reactive } from "vue";
import { login } from "../../services";
import { encryptPassword } from "../../utils";

const formRef = ref(null);
const rules = {
    username: {
        rules: [{ required: true, errorMessage: "请输入用户名" }],
    },
    password: {
        rules: [{ required: true, errorMessage: "请输入密码" }],
    },
};
const formData = reactive({
    username: "",
    password: "",
});
const handleLogin = () => {
    formRef.value.validate().then((values) => {
        login({
            username: values.username,
            password: encryptPassword(values.password),
        }).then((res) => {
            uni.setStorageSync("token", res.token);
            uni.switchTab({
                url: "/pages/index/index",
            });
        });
    });
};
</script>
<template>
    <view class="container">
        <image
            class="img"
            src="../../assets/img/login-header.jpg"
            mode="widthFix"
        ></image>
        <view class="login-form">
            <uni-forms ref="formRef" :rules="rules" :modelValue="formData">
                <uni-forms-item required label="账号" name="username"
                    ><uni-easyinput
                        type="text"
                        v-model="formData.username"
                        placeholder="请输入账号"
                /></uni-forms-item>
                <uni-forms-item required label="密码" name="password"
                    ><uni-easyinput
                        type="password"
                        v-model="formData.password"
                        placeholder="请输入密码"
                /></uni-forms-item>
                <button @click="handleLogin" type="primary" class="btn">
                    立即登录
                </button>
            </uni-forms>
        </view>
    </view>
</template>
<style>
.container {
    font-size: 14px;
    line-height: 24px;
}
.img {
    width: 100%;
}
.login-form {
    padding: 20px;
}
.btn {
    margin-top: 60px;
    background-color: #1677ff;
    color: #fff;
}
</style>
