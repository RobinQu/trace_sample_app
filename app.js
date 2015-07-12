var tv = require('traceview');
tv.traceMode = 'always';

var koa = require('koa');
var Redis = require('ioredis');
var mysql = require('mysql');
var Router = require('koa-router');
var bodyparser = require('koa-bodyparser');

var app = koa();
var redis = new Redis();

var db = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'trace_sample_app'});
db.connect(function (err) {
  if(err) {
    return console.error(err);
  }
  console.log('mysql connection ok');
});


var noop = function () {
  console.log('I do nothing');
};

var slow = function (delay) {
  delay = delay || 100;
  return function (cb) {
    cb = cb || noop;
    setTimeout(cb, delay)
  };
};

var route = new Router();

route.get('/', function* () {
  var key = this.query.key;
  this.assert(key, 400, 'should provide key');

  var ok = yield redis.exists(key);
  if(ok) {
    return this.body = yield redis.get(key);
  }
  var response = yield db.query.bind(db, {
    sql: 'select * from `kv_store` where `key` = ?',
    timeout: 40 * 1000,
    values: [key]
  });
  content = response[0][0].value;
  //slow function
  yield slow(1000);
  //set redis cache
  redis.set(key, content);
  this.body = content;
});

route.post('/', function* () {
  var payload = this.request.body;
  this.assert(payload && payload.key && payload.value, 400, 'should provide correct payload');
  var data = {key: payload.key, value: payload.value};
  this.body = yield db.query.bind(db, 'insert into kv_store set ?', data)
});

app.use(bodyparser());
app.use(route.middleware());

if(require.main === module) {
  app.listen(process.env.PORT || 9999, function () {
    console.log('up and running!');
  });
}

module.exports = app;
