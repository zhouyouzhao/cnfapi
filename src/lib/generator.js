/**
 * 循环遍历对象
 * 以对象属性名为函数名
 * 获取配置
 * 更改本次baseURL
 * 效验参数
 * 拼接get参数
 * 拼接post参数
 */


import urlParse from 'url-parse';
import merge from 'lodash/merge';
import assign from 'lodash/assign';
import jsonSchema2api from './jsonSchema2api';
import Proxy from './Proxy';
import http from './http';

/**
 * errCode
 */

const retcode = {
  OK: 'FE-200',
  PARAM: 'FE-5000',
  OTHER: 'FE-5001',
  CATCH: 'FE-5002',
};

export function generator(list = {}, opts = {}, _this = {}) {
  let listKeys = list,
    isArray = Array.isArray(list);
  if (!isArray) {
    listKeys = Object.keys(list);
  }
  _this = this || _this;

  listKeys.forEach((item) => {
    let fnName = isArray ? item.name : item,
      listVal = isArray ? item : list[item];

    if (!fnName) {
      throw new Error(`Function name is required!`);
    }
    if (_this[fnName]) {
      throw new Error(`Duplicate statements in _this: ${fnName}`);
    }

    _this[fnName] = (function(conf) {
      const fn = function(apiOpts = {}, apiConfig, cb = () => {
      }) {
        apiOpts.fnName = fnName;
        apiOpts.openResInterceptor = apiOpts.openResInterceptor || opts.openResInterceptor;
        apiOpts.resInterceptor = apiOpts.resInterceptor || opts.resInterceptor;
        apiOpts.resSuccessCallback = apiOpts.resSuccessCallback || opts.resSuccessCallback;
        _this._before = _this._before || opts._before;
        apiConfig.url = apiOpts.url || apiConfig.url;

        if (typeof _this._before === 'function') {
          return _this._before(apiOpts, apiConfig, (moreData) => {
            apiOpts = merge(apiOpts, moreData);
            serialize(apiOpts.data || {}, apiConfig.params, (retData) => {
              cb(retData, apiOpts);
            });
          });
        }

        serialize(apiOpts.data || {}, apiConfig.params, (retData) => {
          cb(retData, apiOpts);
        });
      };
      return getProxy(fn, JSON.parse(JSON.stringify(getConfig(conf, opts, fn))));
    }(listVal));

    listVal = null;
  });

  return _this;
}

/**
 * [hasBaseURL 接口配置参数中是否有baseURL]
 * @author youzhao.zhou
 * @date   2018-02-06T17:55:55+0800
 * @param  {String}                 url [接口地址]
 * @return {Boolean}                    [true -- 包含， false -- 不包含]
 */
function hasBaseURL(url) {
  return /^((http:\/\/)|(https:\/\/)|(:\/\/))/.test(url) || /^(localhost)/.test(url);
}

/**
 * [getConfig 接口配置和默认配置合并]
 * @author youzhao.zhou
 * @date   2018-02-06T17:57:03+0800
 * @param  {Object}                 conf        [单个接口的配置]
 * @param  {Object}                 defaultConf [默认配置]
 * @return {Object}                             [合并后的配置]
 */
function getConfig(conf, defaultConf, proxy) {
  let apiConfig = {
      url: '',
      baseURL: defaultConf.baseURL,
      env: defaultConf.env,
      headers: defaultConf.headers,
      timeout: defaultConf.timeout,
      method: conf.method || defaultConf.method,
      model: conf.resSchema || {},
      interval: conf.interval || 0, // 重试间隔时间
      retryTimes: conf.retryTimes || 0, // 重试次数
      pathname: getPathname(conf.apiName),
      params: getParams(conf.params),
      fnName: conf.name,
      signKey: conf.signKey,
      status: '',
      statusText: '',
    },
    apiName = urlParse(conf.apiName);
  apiConfig.url = apiConfig.baseURL + apiConfig.pathname;

  if (hasBaseURL(conf.apiName)) {
    apiConfig = assign(apiConfig, {
      baseURL: apiName.origin,
      pathname: getPathname(apiName.pathname),
      url: apiName.href,
    });
  }
  Object.keys(apiConfig).forEach((key) => {
    if (proxy[key]) {
      throw new Error(`Duplicate statements in proxy Function: ${key}`);
    }
    proxy[key] = apiConfig[key];
  });
  return merge({}, conf, apiConfig);
}

function getRestfulUrl(url = '', data = {}) {
  const re = /\{(.+?)\}/g;
  let result = null;
  do {
    result = re.exec(url);
    if (result && result.length > 1) {
      url = url.replace(result[0], data[result[1]] || '');
    }
  } while (result);
  return url;
}

/**
 * [getParams 将接口配置文件(apiList)中的params重构]
 * 数据结构：
 * {
 *     apiFnName: {
 *         required: true/false,
 *         method: 'POST'/'GET'
 *     }
 * }
 * @author youzhao.zhou
 * @date   2018-02-06T17:58:38+0800
 * @param  {Object}                 params [参数配置对象]
 * @return {Object}                        [重构后的对象]
 */
function getParams(params) {
  const temp = {},
    getParams = params.get || params.GET || [],
    postParams = params.post || params.POST || [];

  getParams.forEach((item) => {
    temp[item.param] = setData(item, 'GET');
  });
  postParams.forEach((item) => {
    temp[item.param] = setData(item, 'POST');
  });
  return temp;

  function setData(item, method) {
    return {
      required: !!item.isNeed,
      method: method.toUpperCase(),
    };
  }
}

/**
 * [serialize 序列化传入后端参数]
 * @author youzhao.zhou
 * @date   2018-02-06T18:01:30+0800
 * @param  {Object}                 data  [入参数据]
 * @param  {Object}                 vaild [有效验证对象]
 * @param  {Function}               cb    [验证结束回调函数]
 */
function serialize(data, vaild, cb = () => {
}) {
  setTimeout(() => {
    const retData = {
        retcode: 'FE-5000',
        errMsg: '',
        data: {},
      },
      qs = [],
      getData = {},
      postData = {},
      isVaild = Object.keys(vaild).every((param) => {
        const item = vaild[param],
          { method } = item,
          { required } = item,
          val = data[param],
          vaildResult = isVaildFn(val, param, required);
        if (!vaildResult.result) {
          retData.errMsg = vaildResult.errMsg;
          return false;
        }

        if (typeof val === 'undefined' || val == null) {
          return true;
        }

        if (method.toUpperCase() === 'GET') {
          getData[param] = val;
          qs.push(`${param}=${encodeURIComponent(val)}`);
        } else {
          postData[param] = val;
        }

        return true;
      });
    if (isVaild) {
      retData.retcode = retcode.OK;
      retData.data = {
        qs: qs.join('&'),
        postData,
        getData,
      };
    } else {
      retData.retcode = retcode.PARAM;
    }
    cb(retData);
  }, 0);
}

function isVaildFn(val, key, required) {
  if (required && (val === null || typeof val === 'undefined')) {
    return {
      result: false,
      errMsg: `param: ${key}. Is Required!`,
    };
  }
  return {
    result: true,
    errMsg: '',
  };
}

/**
 * [getPathname 格式化pathname]
 * @author youzhao.zhou
 * @date   2018-02-06T17:51:58+0800
 * @param  {String}                 pathname [路径]
 * @return {String}                          [格式化后的路径]
 */
function getPathname(pathname) {
  return (/^\//).test(pathname) ? pathname : `/${pathname}`;
}

/**
 * [getProxy 请求接口代理对象]
 * @author youzhao.zhou
 * @date   2018-02-06T17:52:41+0800
 * @param  {Function}               fn        [需要代理的接口函数]
 * @param  {Object}                 apiConfig [该接口的初始化配置参数]
 * @return {Proxy}
 */
function getProxy(fn, apiConfig = {}) {
  return new Proxy(fn, {
    get(target, name) {
      return apiConfig[name];
    },
    set() {
      throw new Error('The property is readonly!');
    },
    apply(target, ctx, args) {
      return new Promise(((resolve, reject) => {
        let { interval } = apiConfig,
          { retryTimes } = apiConfig,
          reqTime = 0;
        request(args[0] || {});

        function request(reqData) {
          ++reqTime;
          target(reqData || {}, apiConfig, (retData, apiOpts) => {
            /**
             * [retData 序列化后的入参对象]
             * retData.qs 序列化后的GET参数
             * retData.getData  get参数
             * retData.postData  post参数
             */
            /**
             * [apiOpts 入参对象]
             */
            const { data } = retData;

            apiConfig = merge(apiConfig, {
              headers: apiOpts.headers,
              timeout: apiOpts.timeout,
              fnName: apiOpts.fnName,
            });

            if (retData.retcode !== retcode.OK) {
              return reject({
                retcode: retData.retcode,
                msg: retData.errMsg,
                headers: apiConfig.headers,
              });
            }

            let reqUrl = apiConfig.url;
            if (apiOpts.restful) {
              reqUrl = getRestfulUrl(reqUrl, apiOpts.restful);
            }

            http({
              url: reqUrl,
              timeout: apiConfig.timeout,
              env: apiConfig.env,
              method: apiConfig.method,
              headers: apiConfig.headers,
              data: data.postData,
              qs: data.qs,
              params: data.getData,
            }).then((res) => {
              /**
               * [res 数据结构]
               * {
                             *     data: {},
                             *     headers: {},
                             *     status: 200,
                             *     statusText: 'ok'
                             * }
               */
              const serverData = res.data;
              apiConfig.status = res.status;
              apiConfig.statusText = res.statusText;

              const isOpenResInterceptor = typeof apiOpts.openResInterceptor === 'function' && apiOpts.openResInterceptor.call(apiConfig, serverData);
              if (isOpenResInterceptor) {
                return apiOpts.resInterceptor.call(apiConfig, serverData, (nOpts = {}) => {
                  const data = merge(reqData.data, nOpts.data),
                    headers = merge(apiOpts.headers, nOpts.headers);
                  reqData.data = data;
                  apiOpts.headers = headers;

                  request(reqData);
                });
              }
              if (typeof apiOpts.resSuccessCallback === 'function') {
                apiOpts.resSuccessCallback(serverData, (err, resData, retcode = 200) => {
                  if (!err) {
                    reqTime = 0;
                    /**
                     * [如果该接口有model配置，则根据model转换后输出]
                     */
                    if (!isEmpty(apiConfig.model)) {
                      resData = modelFn(apiConfig.model, resData);
                    }
                    return resolve(success({
                      data: resData,
                      headers: res.headers,
                      retcode,
                    }));
                  }
                  reject(err || fail({
                    retcode: 500,
                    headers: res.headers,
                  }));
                });
              }
              if (/^2\d/.test(+serverData.retcode)) {
                reqTime = 0;
                let { data } = serverData;
                /**
                 * [如果该接口有model配置，则根据model转换后输出]
                 */
                if (!isEmpty(apiConfig.model)) {
                  data = modelFn(apiConfig.model, data);
                }
                return resolve(success({
                  data,
                  headers: res.headers,
                  retcode: serverData.retcode,
                }));
              }
              reject(fail({
                retcode: serverData.retcode,
                msg: serverData.msg,
                headers: res.headers,
              }));
              // retry(reqTime, retryTimes, interval, (isEnd) => {
              //     if (isEnd) {
              //         reqTime = 0;
              //         return reject(fail({
              //             retcode: serverData.retcode,
              //             msg: serverData.msg,
              //             headers: res.headers
              //         }));
              //     }
              //     request();
              // });
            }, (err) => {
              retry(reqTime, retryTimes, interval, (isEnd) => {
                if (isEnd) {
                  reqTime = 0;
                  return reject(fail({
                    retcode: retcode.OTHER,
                    msg: getType(err) === 'error' ? err.toString() : JSON.stringify(err),
                  }));
                }
                request(reqData);
              });
            }).catch((catchErr) => {
              reqTime = 0;
              reject(fail({
                retcode: retcode.CATCH,
                msg: getType(catchErr) === 'error' ? catchErr.toString() : JSON.stringify(catchErr),
              }));
            });
          });
        }

        function canRetryFn(interval, retryTimes) {
          if (isNaN(interval) || isNaN(retryTimes)) {
            return false;
          }
          interval = parseInt(interval);
          retryTimes = parseInt(retryTimes);
          if (interval <= 0 || retryTimes <= 0) {
            return false;
          }
          return true;
        }

        function retry(times, retryTimes, interval, cb = () => {
        }) {
          if (canRetryFn(interval, retryTimes) && reqTime <= retryTimes) {
            return setTimeout(() => {
              cb(times > retryTimes);
            }, interval);
          }
          cb(true);
        }
      }));
    },
  });
}

/**
 * success return data
 */
function success(res) {
  return {
    data: res.data,
    headers: res.headers,
    retcode: res.retcode,
  };
}

/**
 * fail return data
 */
function fail(res) {
  return {
    retcode: res.retcode || 'FE-5001',
    msg: res.msg || 'unknown',
    headers: res.headers || {},
  };
}

/**
 * serverData 2 FE data
 */
function modelFn(schema, data) {
  const feData = Array.isArray(data) ? [] : {};
  jsonSchema2api(feData, data, schema);
  return feData;
}

/**
 * 判断是否为空对象
 */
function isEmpty(obj) {
  return !obj || !Object.keys(obj).length;
}

/**
 * 获取数据类型
 */
function getType(val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}