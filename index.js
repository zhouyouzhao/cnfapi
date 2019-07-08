if (process.env.NODE_ENV === 'development') {
  module.exports = require('./dist/cnfapi.js');
} else {
  module.exports = require('./dist/cnfapi.min.js');
}
