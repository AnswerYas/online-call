import request from '../utils/request'

// 登录
export const login = (data) => {
    return request({
        url: '/auth/login',
        method: 'POST',
        data,
    })
}

// 查询通话记录
export const getCallLog = (data) => {
    return request({
        url: '/api/customerCallLog',
        method: 'GET',
        data,
    })
}

// 新增通话
export const newCallLog = (data) => {
    return request({
        url: '/api/customerCallLog',
        method: 'POST',
        data,
    })
}

// 修改通话
export const updateCallLog = (data) => {
    return request({
        url: '/api/customerCallLog',
        method: 'PUT',
        data,
    })
}

// 获取用户信息
export const getUserInfo = () => {
    return request({
        url: '/auth/info',
        method: 'GET',
    })
}

// 当前用户通话统计
export const getUserCallStatistics = () => {
    return request({
        url: '/api/customerCallLog/statistics',
        method: 'GET',
    })
}