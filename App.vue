<script>
export default {
    onLaunch: function () {
        console.warn(
            "当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！"
        );
        console.log("App Launch");
        plus.android.requestPermissions(
            [
                "android.permission.ANSWER_PHONE_CALLS", //手动 挂断和接听 需要这个权限
                "android.permission.MODIFY_AUDIO_SETTINGS", //手动 挂断和接听 需要这个权限
                "android.permission.CALL_PHONE", //手动 挂断和接听 需要这个权限
                "android.permission.READ_PHONE_STATE", //>监听电话状态 需要这个权限
                "android.permission.READ_CALL_LOG", //获取号码需要这个权限
                "android.permission.READ_AUDIO", // 录音权限
            ],
            function (resultObj) {
                var result = 0;
                for (var i = 0; i < resultObj.granted.length; i++) {
                    var grantedPermission = resultObj.granted[i];
                    console.log("已获取的权限：" + grantedPermission);
                    result = 1;
                }
                for (var i = 0; i < resultObj.deniedPresent.length; i++) {
                    var deniedPresentPermission = resultObj.deniedPresent[i];
                    console.log(
                        "拒绝本次申请的权限：" + deniedPresentPermission
                    );
                    result = 0;
                }
                for (var i = 0; i < resultObj.deniedAlways.length; i++) {
                    var deniedAlwaysPermission = resultObj.deniedAlways[i];
                    console.log(
                        "永久拒绝申请的权限：" + deniedAlwaysPermission
                    );
                    result = -1;
                }
            },
            function (error) {
                console.log(
                    "申请权限错误：" + error.code + " = " + error.message
                );
            }
        );
    },
    onShow: function () {
        console.log("App Show");
    },
    onHide: function () {
        console.log("App Hide");
    },
};
</script>

<style lang="scss">
/*每个页面公共css */
@import "@/uni_modules/uni-scss/index.scss";
/* #ifndef APP-NVUE */
@import "@/static/customicons.css";
// 设置整个项目的背景色
page {
    background-color: #f5f5f5;
}

/* #endif */
.example-info {
    font-size: 14px;
    color: #333;
    padding: 10px;
}
body {
    font-size: 14px;
}
</style>
