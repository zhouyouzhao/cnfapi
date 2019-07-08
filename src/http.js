/**
 * 借助第三方请求库
 */

import axios from 'axios';
import qs from 'qs';
import assign from 'lodash/assign';

const reqConfig = {
  // `url` is the server URL that will be used for the request
  url: '',

  // `method` is the request method to be used when making the request
  method: 'get', // default

  // `params` are the URL parameters to be sent with the request
  // Must be a plain object or a URLSearchParams object
  params: {},
  // body
  data: {},
  headers: {},
  timeout: 1000,
};

/**
 * [res 数据结构]
 * {
 *     data: {},
 *     headers: {},
 *     status: 200,
 *     statusText: 'ok'
 * }
 */
const https = {
  browser(config) {
    const { data, headers } = config;
    let nData = Array.isArray(data) ? [] : {},
      val = '';
    Object.keys(headers).forEach((header) => {
      if (header.toLowerCase() === 'content-type') {
        val = headers[header];
      }
    });
    if (val.toLowerCase().indexOf('application/json') > -1) {
      nData = JSON.stringify(data);
    }
    if (val.toLowerCase().indexOf('application/x-www-form-urlencoded') > -1) {
      nData = qs.stringify(data);
    }
    config.data = nData;
    return axios(config);
  },
  aliapp(config) {
    return new Promise(((resolve, reject) => {
      let { data } = config,
        nData = Array.isArray(data) ? [] : {},
        { headers } = config,
        val = '';
      Object.keys(headers).forEach((header) => {
        if (header.toLowerCase() === 'content-type') {
          val = headers[header];
        }
      });
      if (val.toLowerCase() === 'application/json') {
        nData = JSON.stringify(data);
      } else {
        Object.keys(data).forEach((item) => {
          if (data[item].toString().slice(1, 7).toLowerCase() === 'object') {
            nData[item] = JSON.stringify(data[item]);
          } else {
            nData[item] = data[item];
          }
        });
      }
      const opts = {
        url: `${config.url}${config.qs ? `?${config.qs}` : ''}`,
        data: nData,
        headers: config.headers,
        method: config.method,
        timeout: config.timeout,
        success(res) {
          resolve({
            data: res.data,
            headers: res.headers,
            status: res.status,
            statusText: '',
          });
        },
        fail(err) {
          reject(err);
        },
      };
      if (config.method.toUpperCase() === 'GET') {
        delete opts.data;
      }
      my.httpRequest(opts);
    }));
  },
  weapp(config) {
    return new Promise(((resolve, reject) => {
      let { data } = config,
        nData = Array.isArray(data) ? [] : {},
        { headers } = config,
        val = '';
      Object.keys(headers).forEach((header) => {
        if (header.toLowerCase() === 'content-type') {
          val = headers[header];
        }
      });
      if (val.toLowerCase() === 'application/x-www-form-urlencoded') {
        Object.keys(data).forEach((item) => {
          if (data[item].toString().slice(1, 7).toLowerCase() === 'object') {
            nData[item] = JSON.stringify(data[item]);
          } else {
            nData[item] = data[item];
          }
        });
      } else {
        nData = data;
      }

      const opts = {
        url: `${config.url}${config.qs ? `?${config.qs}` : ''}`,
        data: nData,
        header: config.headers,
        method: config.method,
        success(res) {
          if (res.statusCode != 200) {
            res.data = {
              retcode: 5000,
              info: {
                errCode: res.statusCode,
                msg: res.data,
                tip: res.data,
              },
              data: {},
            };
          }
          resolve({
            data: res.data,
            headers: res.header,
            status: res.statusCode,
            statusText: '',
          });
        },
        fail(err) {
          reject(err);
        },
        complete(res) {
        },
      };
      if (config.method.toUpperCase() === 'GET') {
        delete opts.data;
      }
      wx.request(opts);
    }));
  },
  swan(config) {
    return new Promise(((resolve, reject) => {
      let { data } = config,
        nData = Array.isArray(data) ? [] : {},
        { headers } = config,
        val = '';
      Object.keys(headers).forEach((header) => {
        if (header.toLowerCase() === 'content-type') {
          val = headers[header];
        }
      });
      if (val.toLowerCase() === 'application/x-www-form-urlencoded') {
        Object.keys(data).forEach((item) => {
          if (data[item].toString().slice(1, 7).toLowerCase() === 'object') {
            nData[item] = JSON.stringify(data[item]);
          } else {
            nData[item] = data[item];
          }
        });
      } else {
        nData = data;
      }

      const opts = {
        url: `${config.url}${config.qs ? `?${config.qs}` : ''}`,
        data: nData,
        header: config.headers,
        method: config.method,
        success(res) {
          if (res.statusCode != 200) {
            res.data = {
              retcode: 5000,
              info: {
                errCode: res.statusCode,
                msg: res.data,
                tip: res.data,
              },
              data: {},
            };
          }
          resolve({
            data: res.data,
            headers: res.header,
            status: res.statusCode,
            statusText: '',
          });
        },
        fail(err) {
          reject(err);
        },
        complete(res) {
        },
      };
      if (config.method.toUpperCase() === 'GET') {
        delete opts.data;
      }
      swan.request(opts);
    }));
  },
};

export default function(opts) {
  if (typeof https[opts.env] !== 'function') {
    throw new Error('http env error!');
  }
  return https[opts.env](assign(reqConfig, opts));
}
