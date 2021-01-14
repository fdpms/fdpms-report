const defaultReport = require('./fdpms-report-default')
const axiosReport = require('./fdpms-report-axios')
const fetchReport = require('./fdpms-report-fetch')
const jqueryReport = require('./fdpms-report-jquery')
const noneReport = require('./fdpms-report-none')

module.exports = {
    Performance: defaultReport,
    defaultReport: defaultReport,
    axiosReport: axiosReport,
    fetchReport: fetchReport,
    jqueryReport: jqueryReport,
    noneReport: noneReport
}
