const dateFormat = require('dateformat')

function inputDateParse (inputDate) {
  // Format the year in case they didn't enter it
  const thisYear = dateFormat('yyyy')
  const dateDB = ((new Date(inputDate)).getFullYear() < thisYear) ? `${thisYear}-${dateFormat(inputDate, 'mm-dd')}` : dateFormat(inputDate, 'yyyy-mm-dd')
  const dateDisplay = ((new Date(inputDate)).getFullYear() < thisYear) ? dateFormat(inputDate, 'mmm d') : dateFormat(inputDate, 'mmm d yyyy')

  return {
    dateDB: dateDB,
    dateDisplay: dateDisplay
  }
}

exports.dateParse = inputDateParse
