
var _sheetID;
var metaData = {
	_lastEmailScanDate: null,
	_lastRowWritten: 1
};
var META_DATA_CELLS = 'Sheet1!J1:K1'; 		/* J1: lastEmailScan 	K1: lastRowWritten */

/**
 * Finds a file by the name passed in and sets _sheetID. If no sheet is found, new sheet is created and still sets _sheetID
 * @param name The name of the file to search for
 * @return {Promise} The result of the asynchronous search for or creation of the sheet, it's sheetID
 */
function initWithSheetNamed(name) {
	return findOrCreateSheetNamed(name);
}
/**
 * Finds a file by the name passed in
 *
 * @param {string} name The name of the file to find
 */
function findSheetNamed(name) {
	return new Promise(function(resolve, reject) {
		var request = gapi.client.drive.files.list({ q: `mimeType="application/vnd.google-apps.spreadsheet" and name="${name}" and trashed=false` });
		request.execute(function(response) {
			if(response.error) {
				return reject(response.error.message);
			}

			return (response.files && response.files.length > 0) ? resolve(response.files[0]) : resolve(null);
		});
	});
}

/**
 * Searches for a Google Sheets file with the name passed in and returns the id. If no Sheet is found, one is created and the id is returned.
 * @param {string} name The name of the file to find
 * @return {id} The id string of the file found or created
 */
function findOrCreateSheetNamed(name) {
	return new Promise(function(resolve, reject) {
		findSheetNamed(name)
		.then(function handleResult(result) {
			if(result) {
				_sheetID = result.id;
				return resolve(result.id);
			} else {
				createSheetNamed(name)
				.then(response => {
					_sheetID = response.result.spreadsheetId;
					return resolve(response.result.spreadsheetId)
				});
			}
		})
		.catch(err => reject(err));
	});
}

/**
 * Creates the job-apps-organizer sheet that we will populate with sent job applications data
 *
 * @param {string} name The name of the to-be-created sheet.
 */
function createSheetNamed(name) {
	return new Promise(function(resolve, reject) {
		var spreadsheetProperties = { title: name };
		var spreadsheetBody = { properties: spreadsheetProperties };
		var request = gapi.client.sheets.spreadsheets.create({}, spreadsheetBody);
		request.then(function(response) {
			return resolve(response);
		});
	});
}

/**
 * Checks Cell J1:K1 to determine when the last email scan was, if ever, and the last row written to
 *
 * @return {Object} Either null if no meta data or { date: _, row: _ }
 */
function readLastScanMetaData() {
	return new Promise(function(resolve, reject) {
		gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: _sheetID, range: META_DATA_CELLS })
		.then(function saveResult(result) {
			// we'll just send the default values if sheet is brand new and has no values yet
			if(result && result.result.values) {
				var date = Date.parse(result.result.values[0][0]);
				if(date === date) {
					metaData._lastEmailScanDate = new Date(result.result.values[0][0]);
				}
				var row = parseInt(result.result.values[0][1]);
				if(row === row && row > 1) { // row === row is a trick to make sure it's a number, bc NaN === NaN is false
					metaData._lastRowWritten = row;
				}
			}
			return resolve(getMetaData());
		})
	});
}


/**
 * Saves the timestamp and the last row written meta data into cells J1:K1 so that
 * the next run of the program only needs to read emails after that date and know
 * where to begin writing new rows
 */
function writeLastScanMetaData() {
	return new Promise(function(resolve, reject) {
		var values = [
			[new Date(), metaData._lastRowWritten]
		];
		var body = { values: values };
		gapi.client.sheets.spreadsheets.values.update({
			spreadsheetId: _sheetID,
			range: META_DATA_CELLS,
			resource: body,
			valueInputOption: 'RAW'
		})
		.then(result => resolve(result));
	});
}


/**
 * Processes an array of email data and for each type, takes some action.
 * apps-sent: writes a row in the sheet
 * apps-rejected: finds row with company and marks it red
 * apps-interested: finds row with company and marks it yellow/green
 * @return {row} The row from which to start writing on the next email scan
 */
function writeJobAppsEmails(emailData, row, id) {
	return new Promise(function(resolve, reject) {
		var values = [];
		// for now, just apps-sent
		var appsSentEmails = emailData.filter(data => data.labelName === 'apps-sent');
		appsSentEmails.forEach(email => values.push( [email.date, email.from] ));
		var range = `Sheet1!A${row}:B${row + values.length - 1}`;
		var params = { spreadsheetId: id, range: range, valueInputOption: 'RAW' };
		var body = { values: values };

		gapi.client.sheets.spreadsheets.values.update(params, body)
		.then(function(result) {
			return resolve(row + values.length - 1);
		});
		// return resolve(row);
	});
}

function getMetaData() {

	return { date: metaData._lastEmailScanDate, row: metaData._lastRowWritten };
}

/**
 * Records apps-sent by writing new rows in the spreadsheet.
 */
function recordAppsSent(apps_sent) {
	return new Promise(function(resolve, reject) {
		var startRow = ++metaData._lastRowWritten;
		// return resolve(row);
		var values = [];
		apps_sent.forEach( email => values.push( [email.date, email.from] ) );
		metaData._lastRowWritten += values.length - 1;
		var endRow = metaData._lastRowWritten;
		var range = `Sheet1!A${startRow}:B${endRow}`;
		var params = { spreadsheetId: _sheetID, range: range, valueInputOption: 'RAW' };
		var body = { values: values };

		gapi.client.sheets.spreadsheets.values.update(params, body)
		.then(function(result) {
			return resolve(result);
		});
	});
}

/**
 * Records apps-sent, apps-rejected, and apps-interested in the spreadsheet.
 * @param {Object} emailsLite An object holding 3 arrays of trimmed emails: { apps_sent, apps_rejected, apps_interested }
 * @return {Object} The result of the write operations.
 */
function recordAppStatusesFromEmails(emailsLite) {
	return new Promise(function(resolve, reject) {
		var emails = emailsLite;
		recordAppsSent(emails.apps_sent)
		.then(res => resolve(res));
	});
}

var SheetsAPI = {
	initWithSheetNamed: initWithSheetNamed,
	readLastScanMetaData: readLastScanMetaData,
	writeLastScanMetaData: writeLastScanMetaData,
	getMetaData: getMetaData,
	writeJobAppsEmails: writeJobAppsEmails,
	recordAppStatusesFromEmails: recordAppStatusesFromEmails
};


export default SheetsAPI;

