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
};

export default function(opts) {
  if (typeof https[opts.env] !== 'function') {
    throw new Error('http env error!');
  }
  return https[opts.env](assign(reqConfig, opts));
}
