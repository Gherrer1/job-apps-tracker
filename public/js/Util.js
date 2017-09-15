
function zeroPad(number) {
	return number < 10 ? '0' + number : number;
}

/**
 * Converts date object into gmail-search friendly format
 * @param {Date} date An instance of Date to be converted to a gmail friendly format.
 * @return {String} a string representing a date in the format of yyyy/mm/dd
 */
function dateFormatter(date) {
	// console.log(date instanceof Date);
	if(!(date instanceof Date))
		throw new Error('date param is not a Date!');
	return `${date.getFullYear()}/${zeroPad(date.getMonth() + 1)}/${zeroPad(date.getDate())}`;
}

var UtilAPI = {
	dateFormatter: dateFormatter
};

export default UtilAPI;