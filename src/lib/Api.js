
import merge from 'lodash/merge';
import { generator } from './generator.js';
import Event from './events.js';

/**
 * 获取数据类型
 */
function getType(val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}

class Api {
  constructor(conf = {}, apiList = {}) {
    const listType = this.getType(apiList);
    if (this.getType(conf) !== 'object' || (listType !== 'object' && listType !== 'array')) {
      throw new Error('constructor params require Object type');
    }
    const _tempApiList = JSON.parse(JSON.stringify(apiList));
    this.merge = merge;
    this.outConf = conf;
    Object.defineProperty(this, 'apiList', {
      get() {
        return _tempApiList;
      },
    });
    this.init();
  }

  init() {
    this.mergeConf(this.initConf, this.outConf);
    generator.apply(this, [JSON.parse(JSON.stringify(this.apiList)), this.defaultOpts]);
  }

  get conf() {
    return this.mergeConf(this.initConf, this.outConf);
  }

  get initConf() {
    return {
      baseURL: {
        required: true,
        errMsg: 'baseURL is required',
        vaildFn(val) {
          return {

            result: /^((http:\/\/)|(https:\/\/)|(:\/\/))([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}(\/)?/.test(val) || /^((http:\/\/)|(https:\/\/)|(:\/\/))(localhost)/.test(val),
            errMsg: 'invalid baseURL',
          };
        },
      },
      timeout: {
        required: true,
        errMsg: 'timeout is required or not 0',
        default() {
          return 3000;
        },
        vaildFn(val) {
          return {
            result: !isNaN(val) && val != 0,
            errMsg: 'invalid timeout',
          };
        },
      },
      env: {
        required: true,
        errMsg: 'invalid env',
        default() {
          return 'browser';
        },
        vaildFn(val) {
          let list = ['browser', 'aliapp', 'weapp', 'swan'],
            resultObj = {
              result: list.indexOf(val) > -1,
              errMsg: 'invalid env, env must in ["browser", "aliapp" ,"weapp", "swan"]',
            };
          if (val === 'aliapp' || val === 'weapp') {
            window = undefined;
            document = undefined;
          }
          if (val === 'browser') {
            resultObj = {
              result: window && document && typeof window !== 'undefined' && typeof document !== 'undefined',
              errMsg: 'invalid env, env not in browser, env must in ["browser", "aliapp" ,"weapp", "swan"]',
            };
          }
          return resultObj;
        },
      },
      openResInterceptor: {
        required: false,
        default() {
          return function() {
            return false;
          };
        },
      },
      resInterceptor: {
        required: false,
        default() {
          return function() {};
        },
      },
      resSuccessCallback: {
        required: false,
        default() {
          return function(serverData, next) {
            next(false, serverData);
          };
        },
      },
      resFormat: {
        description: '接口返回格式',
        required: false,
        default() {
          return {
            type: 'object',
            properties: {
              retcode: {
                type: 'string',
              },
              msg: {
                type: 'string',
              },
              data: {
                type: 'object',
              },
            },
          };
        },
      },
    };
  }

  get defaultOpts() {
    const opts = {
      method: 'GET',
      headers: {
        // 'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    return this.merge(opts, this.outConf, this.conf);
  }

  /**
     * [mergeConf 合并默认参数]
     * @author youzhao.zhou
     * @date   2018-01-24T19:21:59+0800
     * @param  {[type]}                 obj     [元对象]
     * @param  {[type]}                 sources [需要合并对象]
     * @return {Object}                         [返回合并对象]
     */
  mergeConf(obj, sources) {
    const temp = {};
    if (this.getType(obj) !== 'object' || this.getType(sources) !== 'object') {
      throw new Error('mergeConf argument Not Object');
    }
    Object.keys(obj).forEach((key, i) => {
      let val = obj[key],
        vaildResult = null,
        { vaildFn } = obj[key],
        defaultVal = (typeof obj[key].default === 'function' && obj[key].default.apply(this)) || '';
      if (val.required && !defaultVal && !sources[key]) {
        throw new Error(`${val.errMsg}`);
      }
      temp[key] = sources[key] || defaultVal;
      if (typeof vaildFn === 'function') {
        vaildResult = vaildFn(temp[key]);
      }
      if (vaildResult != null && !vaildResult.result) {
        throw new Error(`${vaildResult.errMsg}`);
      }
    });
    return temp;
  }

  openResInterceptor() {
    return this.conf.openResInterceptor.apply(this, arguments);
  }

  /**
     * 请求前统一调用
     * @param apiConf
     * @param cb
     * @private
     */
  _before(apiConf, cb) {
    cb(apiConf);
  }

  /**
     * 请求成功回调函数
     */
  // resSuccessCallback() {}

  /**
     * [getType 获取数据类型]
     * @author youzhao.zhou
     * @date   2018-01-25T11:46:48+0800
     * @param  {Any}                 val [需要获取类型的值]
     * @return {String}                     [val类型]
     */
  getType(val) {
    return getType(val);
  }
}
// import apiList from '../api/apiLists.js';
// let test = new Api({
//     baseURL: 'https://prj-test.xxx.com',
//     timeout: 0,
//     openResInterceptor(res) {
//         if (res.retcode === 5000) {
//             return true;
//         }
//         return false;
//     }
// }, apiList);
// test.initApi({
//     data: {
//         ticket: '5555',
//         openid: '345345345345'
//     },
//     resInterceptor(res) {
//         console.log(res, ' ----> ');
//     }
// }).then(() => {}, (err) => {
//     console.log(err);
// }).catch((cat) => {
//     console.log(cat, ' ------> cat');
// });
// console.log(test.conf.openResInterceptor);
export default Api;
