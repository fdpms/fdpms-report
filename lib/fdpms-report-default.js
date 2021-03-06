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
                if (conf.haveAjax && conf.haveFetch && loadTime && ajaxTime && fetchTime) {
                    console.log("loadTime:" + loadTime + ",ajaxTime:" + ajaxTime + ",fetchTime:" + fetchTime);
                    reportData(1);
                } else if (conf.haveAjax && !conf.haveFetch && loadTime && ajaxTime) {
                    console.log("loadTime:" + loadTime + ",ajaxTime:" + ajaxTime);
                    reportData(1);
                } else if (!conf.haveAjax && conf.haveFetch && loadTime && fetchTime) {
                    console.log("loadTime:" + loadTime + ",fetchTime:" + fetchTime);
                    reportData(1);
                } else if (!conf.haveAjax && !conf.haveFetch && loadTime) {
                    console.log("loadTime:" + loadTime);
                    reportData(1);
                }
            } else {
                // 单页面内ajax上报
                if (conf.haveAjax && conf.haveFetch && ajaxTime && fetchTime) {
                    console.log("ajaxTime:" + ajaxTime + ",fetchTime:" + fetchTime);
                    reportData(2);
                } else if (conf.haveAjax && !conf.haveFetch && ajaxTime) {
                    console.log("ajaxTime:" + ajaxTime);
                    reportData(2);
                } else if (!conf.haveAjax && conf.haveFetch && fetchTime) {
                    console.log("fetchTime:" + fetchTime);
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
                    json.decodedBodySize = json.decodedBodySize || ajaxMsg.decodedBodySize;
                }
                resourceList.push(json);
            });
            conf.resourceList = resourceList;
        };

        // ajax重写


        var _Ajax = function _Ajax(proxy) {
            window._ahrealxhr = window._ahrealxhr || XMLHttpRequest;
            XMLHttpRequest = function XMLHttpRequest() {
                this.xhr = new window._ahrealxhr();
                for (var attr in this.xhr) {
                    var type = "";
                    try {
                        type = _typeof(this.xhr[attr]);
                    } catch (e) {}
                    if (type === "function") {
                        this[attr] = hookfun(attr);
                    } else {
                        Object.defineProperty(this, attr, {
                            get: getFactory(attr),
                            set: setFactory(attr)
                        });
                    }
                }
            };

            function getFactory(attr) {
                return function () {
                    var v = this.hasOwnProperty(attr + "_") ? this[attr + "_"] : this.xhr[attr];
                    var attrGetterHook = (proxy[attr] || {})["getter"];
                    return attrGetterHook && attrGetterHook(v, this) || v;
                };
            }

            function setFactory(attr) {
                return function (v) {
                    var xhr = this.xhr;
                    var that = this;
                    var hook = proxy[attr];
                    if (typeof hook === "function") {
                        xhr[attr] = function () {
                            proxy[attr](that) || v.apply(xhr, arguments);
                        };
                    } else {
                        var attrSetterHook = (hook || {})["setter"];
                        v = attrSetterHook && attrSetterHook(v, that) || v;
                        try {
                            xhr[attr] = v;
                        } catch (e) {
                            this[attr + "_"] = v;
                        }
                    }
                };
            }

            function hookfun(fun) {
                return function () {
                    var args = [].slice.call(arguments);
                    if (proxy[fun] && proxy[fun].call(this, args, this.xhr)) {
                        return;
                    }
                    return this.xhr[fun].apply(this.xhr, args);
                };
            }
            return window._ahrealxhr;
        };

        // 拦截fetch请求


        var _fetch = function _fetch() {
            if (!window.fetch) return;
            var _fetch = fetch;
            window.fetch = function () {
                var _arg = arguments;
                var result = fetArg(_arg);
                if (result.type !== 'report-data') {
                    clearPerformance();
                    var url = result.url ? result.url.split('?')[0] : '';
                    conf.ajaxMsg[url] = result;
                    conf.fetLength = conf.fetLength + 1;
                    conf.haveFetch = true;
                }
                return _fetch.apply(this, arguments).then(function (res) {
                    if (result.type === 'report-data') return res;
                    try {
                        var _url2 = res.url ? res.url.split('?')[0] : '';
                        res.clone().text().then(function (data) {
                            if (conf.ajaxMsg[_url2]) conf.ajaxMsg[_url2]['decodedBodySize'] = data.length;
                        });
                    } catch (e) {}
                    getFetchTime('success');
                    return res;
                }).catch(function (err) {
                    if (result.type === 'report-data') return;
                    getFetchTime('error');
                    //error
                    var defaults = Object.assign({}, errordefo);
                    defaults.t = new Date().getTime();
                    defaults.n = 'fetch';
                    defaults.msg = 'fetch request error';
                    defaults.method = result.method;
                    defaults.data = {
                        resourceUrl: result.url,
                        text: err.stack || err,
                        status: 0
                    };
                    conf.errorList.push(defaults);
                    return err;
                });
            };
        };

        // fetch arguments


        var fetArg = function fetArg(arg) {
            var result = { method: 'GET', type: 'fetchrequest' };
            var args = Array.prototype.slice.apply(arg);

            if (!args || !args.length) return result;
            try {
                if (args.length === 1) {
                    if (typeof args[0] === 'string') {
                        result.url = args[0];
                    } else if (_typeof(args[0]) === 'object') {
                        result.url = args[0].url;
                        result.method = args[0].method;
                    }
                } else {
                    result.url = args[0];
                    result.method = args[1].method || 'GET';
                    result.type = args[1].type || 'fetchrequest';
                }
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
            defaults.data = {
                resourceUrl: xhr.responseURL,
                text: xhr.statusText,
                status: xhr.status
            };
            conf.errorList.push(defaults);
        };

        // fetch get time


        var getFetchTime = function getFetchTime(type) {
            conf.fetchNum += 1;
            if (conf.fetLength === conf.fetchNum) {
                if (type == 'success') {
                    console.log('走了 fetch success 方法');
                } else {
                    console.log('走了 fetch error 方法');
                }
                conf.fetchNum = conf.fetLength = 0;
                fetchTime = new Date().getTime() - beginTime;
                getLargeTime();
            }
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

        var clearPerformance = function clearPerformance(type) {
            if (window.performance && window.performance.clearResourceTimings) {
                if (conf.haveAjax && conf.haveFetch && conf.ajaxLength == 0 && conf.fetLength == 0) {
                    clear(1);
                } else if (!conf.haveAjax && conf.haveFetch && conf.fetLength == 0) {
                    clear(1);
                } else if (conf.haveAjax && !conf.haveFetch && conf.ajaxLength == 0) {
                    clear(1);
                }
            }
        };

        var clear = function clear() {
            var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

            if (window.performance && window.performance.clearResourceTimings) performance.clearResourceTimings();
            conf.performance = {};
            conf.errorList = [];
            conf.preUrl = '';
            conf.resourceList = [];
            conf.page = type === 0 ? location.href : '';
            conf.haveAjax = false;
            conf.haveFetch = false;
            conf.ajaxMsg = {};
            ERRORLIST = [];
            ADDDATA = {};
            ajaxTime = 0;
            fetchTime = 0;
        };

        var filterUrl = ['/api/v1/report/web', 'livereload.js?snipver=1', '/sockjs-node/'];
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
            // 页面fetch数量
            fetchNum: 0,
            // ajax onload数量
            loadNum: 0,
            // 页面ajax数量
            ajaxLength: 0,
            // 页面fetch总数量
            fetLength: 0,
            // 页面ajax信息
            ajaxMsg: {},
            // ajax成功执行函数
            goingType: '',
            // 是否有ajax
            haveAjax: false,
            // 是否有fetch
            haveFetch: false,
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
        var fetchTime = 0;

        // error上报
        if (opt.isError) _error();

        // 绑定onload事件
        addEventListener("load", function () {
            loadTime = new Date().getTime() - beginTime;
            getLargeTime();
        }, false);

        // 执行fetch重写
        if (opt.isAjax || opt.isError) _fetch();

        //  拦截ajax
        if (opt.isAjax || opt.isError) _Ajax({
            onreadystatechange: function onreadystatechange(xhr) {
                if (xhr.readyState === 4) {
                    setTimeout(function () {
                        if (conf.goingType === 'load') return;
                        conf.goingType = 'readychange';
                        var responseURL = xhr.xhr.responseURL ? xhr.xhr.responseURL.split('?')[0] : '';
                        if (conf.ajaxMsg[responseURL]) {
                            try {
                                if (xhr.xhr.response instanceof Blob) {
                                    conf.ajaxMsg[responseURL]['decodedBodySize'] = xhr.xhr.response.size;
                                } else {
                                    conf.ajaxMsg[responseURL]['decodedBodySize'] = xhr.xhr.responseText.length;
                                }
                            } catch (err) {}
                            getAjaxTime('readychange');
                        }
                        if (xhr.status < 200 || xhr.status > 300) {
                            xhr.method = xhr.args.method;
                            ajaxResponse(xhr);
                        }
                    }, 600);
                }
            },
            onerror: function onerror(xhr) {
                if (xhr.args) {
                    xhr.method = xhr.args.method;
                    xhr.responseURL = xhr.args.url;
                    xhr.statusText = 'ajax request error';
                    if (conf.ajaxMsg[xhr.responseURL]) {
                        getAjaxTime('error');
                    }
                }
                ajaxResponse(xhr);
            },
            onload: function onload(xhr) {
                if (xhr.readyState === 4) {
                    if (conf.goingType === 'readychange') return;
                    conf.goingType = 'load';
                    var responseURL = xhr.xhr.responseURL ? xhr.xhr.responseURL.split('?')[0] : '';
                    if (conf.ajaxMsg[responseURL]) {
                        try {
                            if (xhr.xhr.response instanceof Blob) {
                                conf.ajaxMsg[responseURL]['decodedBodySize'] = xhr.xhr.response.size;
                            } else {
                                conf.ajaxMsg[responseURL]['decodedBodySize'] = xhr.xhr.responseText.length;
                            }
                        } catch (err) {}
                        getAjaxTime('load');
                    }
                    if (xhr.status < 200 || xhr.status > 300) {
                        xhr.method = xhr.args.method;
                        ajaxResponse(xhr);
                    }
                }
            },
            open: function open(arg, xhr) {
                if (opt.filterUrl && opt.filterUrl.length) {
                    var begin = false;
                    opt.filterUrl.forEach(function (item) {
                        if (arg[1].indexOf(item) != -1) begin = true;
                    });
                    if (begin) return;
                }

                var result = { url: arg[1].split('?')[0], method: arg[0] || 'GET', type: 'xmlhttprequest' };
                this.args = result;

                clearPerformance();
                conf.ajaxMsg[result.url] = result;
                conf.ajaxLength = conf.ajaxLength + 1;
                conf.haveAjax = true;
            }
        });
    } catch (err) {}
}