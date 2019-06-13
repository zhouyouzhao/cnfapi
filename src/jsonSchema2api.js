// let jsonSchema = {
//     "title": "Test",
//     "description": "a demo",
//     "type": "object",
//     "properties": {
//         "cate": {
//             "type": "array",
//             "serverName": "cates",
//             "items": {
//                 "type": "object",
//                 "properties": {
//                     "cids": {
//                         "serverName": "cid",
//                         "type": "other"
//                     },
//                     "name": {
//                         "serverName": "name",
//                         "type": "other"
//                     },
//                     "thumb": {
//                         "serverName": "thumb",
//                         "type": "other"
//                     },
//                     "thumbGray": {
//                         "serverName": "thumb_gray",
//                         "type": "other"
//                     },
//                     "subCates": {
//                         "serverName": "sub_cates",
//                         "type": "array",
//                         "items": {
//                             "type": "object",
//                             "properties": {
//                                 "cids": {
//                                     "serverName": "cid",
//                                     "type": "other"
//                                 },
//                                 "name": {
//                                     "serverName": "name",
//                                     "type": "other"
//                                 },
//                                 "sort": {
//                                     "serverName": "sort",
//                                     "type": "other"
//                                 },
//                                 "pid": {
//                                     "serverName": "pid",
//                                     "type": "other"
//                                 },
//                                 "categoryType": {
//                                     "serverName": "category_type",
//                                     "type": "other"
//                                 },
//                                 "foods": {
//                                     "serverName": "foods",
//                                     "type": "array",
//                                     "items": {
//                                         "type": "other"
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         },
//         "foods": {
//             "serverName": "food",
//             "type": "object",
//             "properties": {
//                 "any": {
//                     "serverName": "any",
//                     "type": "object",
//                     "properties": {
//                         "names": {
//                             "serverName": "name",
//                             "type": "other"
//                         },
//                         "fds": {
//                             "serverName": "fd",
//                             "type": "other"
//                         }
//                     }
//                 }
//             }
//         }
//     }
// };
// let apiData = {
//     cates: [
//         {
//             cid: "hamburger",
//             name: "非常堡",
//             thumb: "",
//             thumb_gray: "",
//             sub_cates: [
//                 {
//                     cid: "924",
//                     name: "非常堡",
//                     sort: "1",
//                     pid: "841",
//                     category_type: "lunch",
//                     foods: [
//                         "692470",
//                         "692471",
//                         "692472",
//                         "692473"
//                     ]
//                 }
//             ]
//         },
//         {
//             cid: "hamburger",
//             name: "非常堡",
//             thumb: "",
//             thumb_gray: "",
//             sub_cates: [
//                 {
//                     cid: "926",
//                     name: "非常堡",
//                     sort: "1",
//                     pid: "841",
//                     category_type: "lunch",
//                     foods: [
//                         "692470",
//                         "692471",
//                         "692472",
//                         "692473"
//                     ]
//                 }
//             ]
//         }
//     ],
//     food: {
//         123: {
//             name: '2333',
//             fd: 123
//         }
//     }
// };
// let testObj = {};
// jsonSchema2api(testObj, apiData, jsonSchema);

function jsonSchema2api(newData = {}, data = {}, schema) {
  if (!schema) {
    throw new Error('arguments[2](schema) is not defined!');
  }
  if (!data || (Array.isArray(data) && !data.length)) {
    return data;
  }
  const rootTypeFn = {
    object() {
      objectTransform(newData, data, schema);
    },
    array() {
      arrayTransform(newData, data, schema);
    },
  };
  const fn = rootTypeFn[schemaType(getType(data))];
  typeof fn === 'function' && fn();
}

function objectTransform(newData, data, schema) {
  const dataKeys = Object.keys(data),
    { properties } = schema,
    schemaKeys = Object.keys(properties);
  if (dataKeys.length <= 0) {
    return newData;
  }
  if (schemaKeys.indexOf('any') > -1) {
    return dataKeys.forEach((schemaKey) => {
      const serverName = schemaKey;
      const dataVal = data[serverName];
      const dataType = schemaType(getType(dataVal));
      if (dataType === 'object' || dataType === 'array') {
        if (!properties.any.properties && !properties.any.items) {
          throw new Error(`object array has not sub`);
        }
        newData[schemaKey] = {};
        if (dataType === 'array') {
          newData[schemaKey] = [];
        }
        return jsonSchema2api(newData[schemaKey], dataVal, properties.any);
      }
      if (dataKeys.indexOf(serverName) > -1) {
        newData[schemaKey] = dataVal;
      }
    });
  }
  schemaKeys.forEach((schemaKey) => {
    const { serverName } = properties[schemaKey];
    // 根据serverName获取接口对应数据
    const dataVal = data[serverName];
    const dataType = schemaType(getType(dataVal));
    if (dataVal === null) {
      newData[schemaKey] = dataVal;
      return true;
    }
    if (properties[schemaKey].type !== dataType) {
      throw new Error(`server data [${serverName}] type not equal jsonSchema [${schemaKey}] type`);
    }
    if (dataType === 'object' || dataType === 'array') {
      if (!properties[schemaKey].properties && !properties[schemaKey].items) {
        throw new Error(`object array has not sub`);
      }
      newData[schemaKey] = {};
      if (dataType === 'array') {
        newData[schemaKey] = [];
      }
      return jsonSchema2api(newData[schemaKey], dataVal, properties[schemaKey]);
    }
    // 判断jsonschema中的serverName在接口数据中是否存在数据
    // 是 --- 判断是否为对象，否 -- 结束循环，是 -- 递归
    // 否 --- 抛错
    if (dataKeys.indexOf(serverName) > -1) {
      newData[schemaKey] = dataVal;
    }
  });
}

function arrayTransform(newData, data, schema) {
  const subSchema = schema.items;
  const schemaDType = subSchema.type;
  data.forEach((item, i) => {
    const serverItemType = schemaType(getType(item));
    if (!newData[i]) {
      if (serverItemType === 'array') {
        newData[i] = [];
      }
      if (serverItemType === 'object') {
        newData[i] = {};
      }
    }
    if (item === null) {
      newData[i] = item;
      return true;
    }
    // 数组元素类型schemaDType： object array other(number, string, boolean)
    /**
         * 如果是schemaDType(schema定义的类型)与api数据的类型不匹配，则报错，
         * object array，则递归
         */
    if (serverItemType === 'none') {
      throw new Error(`api key type error`);
    }
    if (schemaDType !== serverItemType) {
      throw new Error(`api key type not match schema key type`);
    }
    if (serverItemType === 'object' || serverItemType === 'array') {
      return jsonSchema2api(newData[i], item, subSchema);
    }
    if (schemaDType === 'other') {
      newData[i] = item;
    }
  });
}

function schemaType(type) {
  const typeSet = {
    object: 'object',
    array: 'array',
    other: 'other',
  };
  let getType = typeSet[type];
  if (!getType) {
    getType = (function(type) {
      const otherType = ['number', 'string', 'boolean'];
      if (otherType.indexOf(type) > -1) {
        return 'other';
      }
      return false;
    }(type));
  }
  return getType || 'none';
}

function getType(val) {
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase();
}

export default jsonSchema2api;
