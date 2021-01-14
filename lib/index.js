'use strict';

var defaultReport = require('./fdpms-report-default');
var axiosReport = require('./fdpms-report-axios');
var fetchReport = require('./fdpms-report-fetch');
var jqueryReport = require('./fdpms-report-jquery');
var noneReport = require('./fdpms-report-none');

module.exports = {
    Performance: defaultReport,
    defaultReport: defaultReport,
    axiosReport: axiosReport,
    fetchReport: fetchReport,
    jqueryReport: jqueryReport,
    noneReport: noneReport
};