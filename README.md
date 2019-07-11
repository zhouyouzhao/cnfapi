## cnfapi
----------------------------
author: bugszhou | Email:bugszhou@outlook.com <br>
description: A lib project with ziu

cnfapi是基于axios的小程序http库

### Features

* 支持 promise API
* 拦截请求和响应
* 自动转换 JSON 数据

### 安装

```shell
npm install -S cnfapi-miniprogram
```

### Example

```javascript
import Api from 'cnfapi-miniprogram';

const api = new Api({
  baseURL: 'https://prj1.demo.com',
  env: 'browser', // 使用环境：browser - 浏览器
  timeout: 10000, // 10s超时
  headers: {
    'Content-Type': 'application/json',
  },
  resSuccessCallback(data, next) {
    // next接受3个参数
    // 第一个参数是代表error
    // 第二个参数是代表传递给 resolve 的数据
    // 第三个参数是自定义数据
    if (data.code === 200) {
      next(null, data.data, data.code);
    } else {
      next({
        msg: data.msg,
        retcode: data.code,
      }, {}, data.code);
    }
  },
}, {
     getList: {
       interval: 2000, // 每隔2秒重试一次
       retryTimes: 10, // 重试10次
       apiName: '/test/prj/getList', // 接口pathurl
       desc: '', // 接口描述
       method: 'POST',
       params: {
         // post参数
         post: [{
            param: 'param1', // 参数名
            isNeed: 1, // 是否必须 1 为必须、0为非必须
         }],
         // get参数
         get: [{
           param: 'param2', // 参数名
           isNeed: 0, // 是否必须 1 为必须、0为非必须
        }],
       },
     },
     // restful模式
     getOrders: {
       interval: 2000, // 每隔2秒重试一次
       retryTimes: 10, // 重试10次
       apiName: '/test/prj/getOrders/{orderid}', // 接口pathurl
       desc: '', // 接口描述
       method: 'POST',
       params: {},
     },
   });

   // http请求调用方式
   // 1. 常规方式
   api.getList({
     data: {
       param1: 'param1',
       param2: 'param2',
     }
   })
   .then(({ data }) => {
     // 服务端数据
     console.log(data);
   })
   .catch(err => {
     console.log(err);
   });
   // 2. restful方式
   api.getOrders({
     restful: {
       orderid: 'param1',
     }
   })
   .then(({ data }) => {
     // 服务端数据
     console.log(data);
   })
   .catch(err => {
     console.log(err);
   });

```
