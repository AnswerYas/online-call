import JSEncrypt from "jsencrypt";

const PUBKEY =
    "-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCCVk5T5wMPtIvpf0ycQtHdOP06riB3kVRc9fa7Oytjsnd+31B5HZSXqBN2QX+cHp7JWbGoKfXw5fWKNQdwrEZx/MaMxFAaphEDkyHisBYO56PfOITXWGGTBKhVDhg69ZmfEbZ5YeJ1QM3T4T/WD9Lf2gUcc8yS1Q+GEKkEpCO3FwIDAQAB-----END PUBLIC KEY-----";

export const encryptPassword = (password) => {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(PUBKEY);
    return encryptor.encrypt(password);
};

export const formatFieldsValue = (values) => {
    const result = { ...values };
    Object.keys(result).forEach((key) => {
        if (
            Object.prototype.toString.call(values[key]) === "[object Object]" &&
            values[key].hasOwnProperty("id")
        ) {
            result[`${key}Id`] = values[key].id;
        }
    });
    return result;
};

export const formatTreeData = (data, titleKey, valueKey) => {
    if (!Array.isArray(data)) return;
    const result = [];
    function loop(data, origin) {
        if (Array.isArray(data) && data.length > 0) {
            data.forEach((item) => {
                const originItem = {
                    title: item[titleKey],
                    key: item[valueKey],
                    children: [],
                };
                origin.push(originItem);
                if (Array.isArray(item.children) && item.children.length > 0) {
                    loop(item.children, originItem.children);
                }
            });
        } else {
            return;
        }
    }
    loop(data, result);
    return result;
};

export const formatTel = (tel) => {
    var reg = /^(\d{3})\d{4}(\d{4})$/;
    return tel ? tel.replace(reg, "$1****$2") : "";
};
