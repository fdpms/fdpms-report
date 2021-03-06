"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (typeof require === 'function' && (typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && (typeof module === "undefined" ? "undefined" : _typeof(module)) === "object") {
    module.exports = Performance;
} else {
    window.Performance = Performance;
}

window.ERRORLIST = [];
window.ADDDATA = {};
Performance.addError = function (err) {
    err = {
        method: 'GET',
        msg: err.msg,
        n: 'js',
        data: {
            col: err.col,
            line: err.line,
            resourceUrl: err.resourceUrl
        }
    };
    ERRORLIST.push(err);
};
Performance.addData = function (fn) {
    fn && fn(ADDDATA);
};

function randomString(len) {
    len = len || 10;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz123456789';
    var maxPos = $chars.length;
    var pwd = '';
    for (var i = 0; i < len; i++) {
        pwd = pwd + $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd + new Date().getTime();
}

// web msgs report function
function Performance(option, fn) {
    try {

        // 获得markpage
        var markUser = function markUser() {
            var markUser = sessionStorage.getItem('ps_markUser') || '';
            var result = {
                markUser: markUser,
                isFristIn: false
            };
            if (!markUser) {
                markUser = randomString();
                sessionStorage.setItem('ps_markUser', markUser);
                result.markUser = markUser;
                result.isFristIn = true;
            }
            return result;
        };

        // 获得Uv


        var markUv = function markUv() {
            var date = new Date();
            var markUv = localStorage.getItem('ps_markUv') || '';
            var datatime = localStorage.getItem('ps_markUvTime') || '';
            var today = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' 23:59:59';
            if (!markUv && !datatime || date.getTime() > datatime * 1) {
                markUv = randomString();
                localStorage.setItem('ps_markUv', markUv);
                localStorage.setItem('ps_markUvTime', new Date(today).getTime());
            }
            return markUv;
        };

        // 资源过滤


        var filterResource = function filterResource() {
            var reslist = conf.resourceList;
            var filterUrl = opt.filterUrl;
            var newlist = [];
            if (reslist && reslist.length && filterUrl && filterUrl.length) {
                for (var i = 0; i < reslist.length; i++) {
                    var begin = false;
                    for (var j = 0; j < filterUrl.length; j++) {
                        if (reslist[i]['name'].indexOf(filterUrl[j]) > -1) {
                            begin = true;
                            break;
                        }
                    }
                    if (!begin) newlist.push(reslist[i]);
                }
            }
            conf.resourceList = newlist;
        };

        // report date
        // @type  1:页面级性能上报  2:页面ajax性能上报  3：页面内错误信息上报


        var reportData = function reportData() {
            var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

            setTimeout(function () {
                if (opt.isPage) perforPage();
                if (opt.isResource || opt.isAjax) perforResource();
                if (ERRORLIST && ERRORLIST.length) conf.errorList = conf.errorList.concat(ERRORLIST);
                var w = document.documentElement.clientWidth || document.body.clientWidth;
                var h = document.documentElement.clientHeight || document.body.clientHeight;

                var markuser = markUser();

                var result = {
                    time: new Date().getTime(),
                    addData: ADDDATA,
                    markUser: markuser.markUser,
                    markUv: markUv(),
                    type: type,
                    url: location.href

                    // 过滤
                };filterResource();

                if (type === 1) {
                    // 1:页面级性能上报
                    result = Object.assign(result, {
                        preUrl: conf.preUrl,
                        errorList: conf.errorList,
                        performance: conf.performance,
                        resourceList: conf.resourceList,
                        isFristIn: markuser.isFristIn,
                        screenwidth: w,
                        screenheight: h
                    });
                } else if (type === 2) {
                    // 2:页面ajax性能上报
                    result = Object.assign(result, {
                        resourceList: conf.resourceList,
                        errorList: conf.errorList
                    });
                } else if (type === 3) {
                    // 3：页面内错误信息上报
                    result = Object.assign(result, {
                        errorList: conf.errorList,
                        resourceList: conf.resourceList
                    });
                }

                result = Object.assign(result, opt.add);
                fn && fn(result);
                if (!fn && window.fetch) {
                    fetch(opt.domain, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        type: 'report-data',
                        body: JSON.stringify(result)
                    });
                }
                // 清空无关数据
                Promise.resolve().then(function () {
                    clear();
                });
            }, opt.outtime);
        };

        //比较onload与ajax时间长度


        var getLargeTime = function getLargeTime() {
            if (conf.page !== location.href) {
                // 页面级性能上报
                if (conf.haveAjax && loadTime && ajaxTime) {
                    console.log("loadTime:" + loadTime + ",ajaxTime:" + ajaxTime);
                    reportData(1);
                } else if (!conf.haveAjax && loadTime) {
                    console.log("loadTime:" + loadTime);
                    reportData(1);
                }
            } else {
                // 单页面内ajax上报
                if (conf.haveAjax && ajaxTime) {
                    console.log("ajaxTime:" + ajaxTime);
                    reportData(2);
                }
            }
        };

        // 统计页面性能


        var perforPage = function perforPage() {
            if (!window.performance) return;
            var timing = performance.timing;
            conf.performance = {
                // DNS解析时间
                dnst: timing.domainLookupEnd - timing.domainLookupStart || 0,
                //TCP建立时间
                tcpt: timing.connectEnd - timing.connectStart || 0,
                // 白屏时间  
                wit: timing.responseStart - timing.navigationStart || 0,
                //dom渲染完成时间
                domt: timing.domContentLoadedEventEnd - timing.navigationStart || 0,
                //页面onload时间
                lodt: timing.loadEventEnd - timing.navigationStart || 0,
                // 页面准备时间 
                radt: timing.fetchStart - timing.navigationStart || 0,
                // 页面重定向时间
                rdit: timing.redirectEnd - timing.redirectStart || 0,
                // unload时间
                uodt: timing.unloadEventEnd - timing.unloadEventStart || 0,
                //request请求耗时
                reqt: timing.responseEnd - timing.requestStart || 0,
                //页面解析dom耗时
                andt: timing.domComplete - timing.domInteractive || 0
            };
        };

        // 统计页面资源性能


        var perforResource = function perforResource() {
            if (!window.performance || !window.performance.getEntries) return false;
            var resource = performance.getEntriesByType('resource');

            var resourceList = [];
            if (!resource && !resource.length) return resourceList;

            resource.forEach(function (item) {
                if (!opt.isAjax && (item.initiatorType == 'xmlhttprequest' || item.initiatorType == 'fetchrequest')) return;
                if (!opt.isResource && item.initiatorType != 'xmlhttprequest' && item.initiatorType !== 'fetchrequest') return;
                var json = {
                    name: item.name,
                    method: 'GET',
                    type: item.initiatorType,
                    duration: item.duration.toFixed(2) || 0,
                    decodedBodySize: item.decodedBodySize || 0,
                    nextHopProtocol: item.nextHopProtocol
                };
                var name = item.name ? item.name.split('?')[0] : '';
                var ajaxMsg = conf.ajaxMsg[name] || '';
                if (ajaxMsg) {
                    json.method = ajaxMsg.method || 'GET';
                    json.type = ajaxMsg.type || json.type;
                    json.options = ajaxMsg.options || '';
                    json.decodedBodySize = json.decodedBodySize || ajaxMsg.decodedBodySize;
                }
                resourceList.push(json);
            });
            conf.resourceList = resourceList;
        };

        // ajax重写


        var _Axios = function _Axios() {
            if (!window.axios) return;
            var _axios = window.axios;
            var List = ['axios', 'request', 'get', 'delete', 'head', 'options', 'put', 'post', 'patch'];
            List.forEach(function (item) {
                _reseat(item);
            });

            function _reseat(item) {
                var _key = null;
                if (item === 'axios') {
                    window['axios'] = resetFn;
                    _key = _axios;
                } else if (item === 'request') {
                    window['axios']['request'] = resetFn;
                    _key = _axios['request'];
                } else {
                    window['axios'][item] = resetFn;
                    _key = _axios[item];
                }

                function resetFn() {
                    var result = ajaxArg(arguments, item);
                    if (result.report !== 'report-data') {
                        var url = result.url ? result.url.split('?')[0] : '';
                        conf.ajaxMsg[url] = result;
                        conf.ajaxLength = conf.ajaxLength + 1;
                        conf.haveAjax = true;
                    }
                    return _key.apply(this, arguments).then(function (res) {
                        if (result.report === 'report-data') return res;
                        getAjaxTime('load');
                        try {
                            var responseURL = res.request.responseURL ? res.request.responseURL.split('?')[0] : '';
                            var responseText = res.request.responseText;
                            if (conf.ajaxMsg[responseURL]) conf.ajaxMsg[responseURL]['decodedBodySize'] = responseText.length;
                        } catch (e) {}
                        return res;
                    }).catch(function (err) {
                        if (result.report === 'report-data') return res;
                        getAjaxTime('error');
                        //error
                        ajaxResponse({
                            statusText: err.message,
                            method: result.method,
                            responseURL: result.url,
                            options: result.options,
                            status: err.response ? err.response.status : 0
                        });
                        return err;
                    });
                }
            }
        };

        // Ajax arguments


        var ajaxArg = function ajaxArg(arg, item) {
            var result = { method: 'GET', type: 'xmlhttprequest', report: '' };
            var args = Array.prototype.slice.apply(arg);
            try {
                if (item == 'axios' || item == 'request') {
                    result.url = args[0].url;
                    result.method = args[0].method;
                    result.options = result.method.toLowerCase() == 'get' ? args[0].params : args[0].data;
                } else {
                    result.url = args[0];
                    result.method = '';
                    if (args[1]) {
                        if (args[1].params) {
                            result.method = 'GET';
                            result.options = args[1].params;
                        } else {
                            result.method = 'POST';
                            result.options = args[1];
                        }
                    }
                }
                result.report = args[0].report;
            } catch (err) {}
            return result;
        };

        // 拦截js error信息


        var _error = function _error() {
            // img,script,css,jsonp
            window.addEventListener('error', function (e) {
                var defaults = Object.assign({}, errordefo);
                defaults.n = 'resource';
                defaults.t = new Date().getTime();
                defaults.msg = e.target.localName + ' is load error';
                defaults.method = 'GET';
                defaults.data = {
                    target: e.target.localName,
                    type: e.type,
                    resourceUrl: e.target.href || e.target.currentSrc
                };
                if (e.target != window) conf.errorList.push(defaults);
            }, true);
            // js
            window.onerror = function (msg, _url, line, col, error) {
                var defaults = Object.assign({}, errordefo);
                setTimeout(function () {
                    col = col || window.event && window.event.errorCharacter || 0;
                    defaults.msg = error && error.stack ? error.stack.toString() : msg;
                    defaults.method = 'GET';
                    defaults.data = {
                        resourceUrl: _url,
                        line: line,
                        col: col
                    };
                    defaults.t = new Date().getTime();
                    conf.errorList.push(defaults);
                    // 上报错误信息
                    if (conf.page === location.href && !conf.haveAjax) reportData(3);
                }, 0);
            };
            window.addEventListener('unhandledrejection', function (e) {
                var error = e && e.reason;
                var message = error.message || '';
                var stack = error.stack || '';
                // Processing error
                var resourceUrl = void 0,
                    col = void 0,
                    line = void 0;
                var errs = stack.match(/\(.+?\)/);
                if (errs && errs.length) errs = errs[0];
                errs = errs.replace(/\w.+[js|html]/g, function ($1) {
                    resourceUrl = $1;return '';
                });
                errs = errs.split(':');
                if (errs && errs.length > 1) line = parseInt(errs[1] || 0);
                col = parseInt(errs[2] || 0);
                var defaults = Object.assign({}, errordefo);
                defaults.msg = message;
                defaults.method = 'GET';
                defaults.t = new Date().getTime();
                defaults.data = {
                    resourceUrl: resourceUrl,
                    line: col,
                    col: line
                };
                conf.errorList.push(defaults);
                if (conf.page === location.href && !conf.haveAjax) reportData(3);
            });
            // 重写console.error
            var oldError = console.error;
            console.error = function (e) {
                var defaults = Object.assign({}, errordefo);
                setTimeout(function () {
                    defaults.msg = e;
                    defaults.method = 'GET';
                    defaults.t = new Date().getTime();
                    defaults.data = {
                        resourceUrl: location.href
                    };
                    conf.errorList.push(defaults);
                    if (conf.page === location.href && !conf.haveAjax) reportData(3);
                }, 0);
                return oldError.apply(console, arguments);
            };
        };

        // ajax统一上报入口


        var ajaxResponse = function ajaxResponse(xhr, type) {
            var defaults = Object.assign({}, errordefo);
            defaults.t = new Date().getTime();
            defaults.n = 'ajax';
            defaults.msg = xhr.statusText || 'ajax request error';
            defaults.method = xhr.method;
            defaults.options = xhr.options;
            defaults.data = {
                resourceUrl: xhr.responseURL,
                text: xhr.statusText,
                status: xhr.status
            };
            conf.errorList.push(defaults);
        };

        // ajax get time


        var getAjaxTime = function getAjaxTime(type) {
            conf.loadNum += 1;
            if (conf.loadNum === conf.ajaxLength) {
                if (type == 'load') {
                    console.log('走了AJAX onload 方法');
                } else if (type == 'readychange') {
                    console.log('走了AJAX onreadystatechange 方法');
                } else {
                    console.log('走了 error 方法');
                }
                conf.ajaxLength = conf.loadNum = 0;
                ajaxTime = new Date().getTime() - beginTime;
                getLargeTime();
            }
        };

        var clear = function clear() {
            if (window.performance && window.performance.clearResourceTimings) performance.clearResourceTimings();
            conf.performance = {};
            conf.errorList = [];
            conf.preUrl = '';
            conf.resourceList = [];
            conf.page = location.href;
            conf.haveAjax = false;
            conf.ajaxMsg = {};
            ERRORLIST = [];
            ADDDATA = {};
            ajaxTime = 0;
        };

        var filterUrl = ['/api/v1/report/web', 'livereload.js?snipver=1', '/sockjs-node/info'];
        var opt = {
            // 上报地址
            domain: 'http://localhost/api',
            // 脚本延迟上报时间
            outtime: 300,
            // ajax请求时需要过滤的url信息
            filterUrl: [],
            // 是否上报页面性能数据
            isPage: true,
            // 是否上报ajax性能数据
            isAjax: true,
            // 是否上报页面资源数据
            isResource: true,
            // 是否上报错误信息
            isError: true,
            // 提交参数
            add: {}
        };
        opt = Object.assign(opt, option);
        opt.filterUrl = opt.filterUrl.concat(filterUrl);
        var conf = {
            //资源列表 
            resourceList: [],
            // 页面性能列表
            performance: {},
            // 错误列表
            errorList: [],
            // ajax onload数量
            loadNum: 0,
            // 页面ajax数量
            ajaxLength: 0,
            // 页面ajax信息
            ajaxMsg: {},
            // ajax成功执行函数
            goingType: '',
            // 是否有ajax
            haveAjax: false,
            // 来自域名
            preUrl: document.referrer && document.referrer !== location.href ? document.referrer : '',
            // 当前页面
            page: ''
            // error default
        };var errordefo = {
            t: '',
            n: 'js',
            msg: '',
            data: {}
        };

        var beginTime = new Date().getTime();
        var loadTime = 0;
        var ajaxTime = 0;

        // error上报
        if (opt.isError) _error();

        // 绑定onload事件
        addEventListener("load", function () {
            loadTime = new Date().getTime() - beginTime;
            getLargeTime();
        }, false);

        //  拦截ajax
        if (opt.isAjax || opt.isError) _Axios();
    } catch (err) {}
}