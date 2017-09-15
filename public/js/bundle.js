/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = appendPre;
/* harmony export (immutable) */ __webpack_exports__["b"] = clearPre;
/**
 * Append a pre element to the body containing the given message as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in the pre element.
 */
function appendPre(message) {
	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}

/* removes all the text from the pre element */
function clearPre() {
	var pre = document.getElementById('content');
	pre.innerHTML = '';
}

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Sheets__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Mail__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__UI__ = __webpack_require__(0);





var CLIENT_ID = '643118581198-1ahtvd2u2o98l2hur59mrctu60km0gb7.apps.googleusercontent.com';
// Array of API discovery doc URLs for APIs used by the quickstart - I guess this adds namespaces (gmail, sheets) to the gapi.client object
// because we were allowed to access them and make requests with them before we added the necessary scopes, we just received 403 responses
var DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
// Authorization scopes required by the API; multiple scopes can be included, separated by spaces. - tells googles servers that your app/clientID
// can make certain requests
var SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
 * On load, called to load the auth2 library and API client library.
 */
var already_ran = false;
function handleClientLoad() { // yeah, this is called by onload attribute of script tag that loads google's js. this is called after google's js executes
	if(!already_ran) {
		already_ran = true;
		gapi.load('client:auth2', initClient);
	} else {
		console.log('already ran, sorry ;)');
	}
}

/**
 * Initializes the API client library and sets up sign-in state listeners.
 */
function initClient() {
	gapi.client.init({
		discoveryDocs: DISCOVERY_DOCS,
		clientId: CLIENT_ID,
		scope: SCOPES
	}).then(function() { // after we've initialized the client library
		// listen for sign-in state changes
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

		// handle the initial sign-in state.
		updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		authorizeButton.onclick = handleAuthClick;
		signoutButton.onclick = handleSignoutClick;
	});
}

/* *
 * Called when the signed in status changes, tto update the UI appropriately. After a sign=in, the API is called
 */
function updateSigninStatus(isSignedIn) {
	if(isSignedIn) {
		authorizeButton.style.display = 'none';
		signoutButton.style.display = 'block';
		
		/* Essentially where all the magic happens. Once app acknowledges that user is signed in, the app can start running. */
		Object(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */])('Logged in, looking for your organizer sheet...');

		var JOB_APPS_ORGANIZER_SHEET_NAME = 'fake31';
		var _trimmedEmailData;

		__WEBPACK_IMPORTED_MODULE_0__Sheets__["a" /* default */].initWithSheetNamed(JOB_APPS_ORGANIZER_SHEET_NAME)
		.then(id => Object(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */])('Sheet ID: ' + id))
		.then(__WEBPACK_IMPORTED_MODULE_0__Sheets__["a" /* default */].readLastScanMetaData)
		.then(metaData => { metaData ? Object(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */])('Date: ' + metaData.date + '\nRow: ' + metaData.row) : Object(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */])('Brand new sheet, no meta data yet')})
		.then(__WEBPACK_IMPORTED_MODULE_0__Sheets__["a" /* default */].getMetaData).then(metaData => metaData.date)
		.then(__WEBPACK_IMPORTED_MODULE_1__Mail__["a" /* default */].loadEmailsAfter)
		.then(messages => {
			Object(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */])('Loaded emails...');
			messages.apps_sent = messages.apps_sent.map( trimEmailJsonFat );
			messages.apps_rejected = messages.apps_rejected.map ( trimEmailJsonFat );
			messages.apps_interested = messages.apps_interested.map( trimEmailJsonFat );
			return messages;
		})
		.then(__WEBPACK_IMPORTED_MODULE_0__Sheets__["a" /* default */].recordAppStatusesFromEmails)
		.then(res => console.log(res))
		.then(__WEBPACK_IMPORTED_MODULE_0__Sheets__["a" /* default */].writeLastScanMetaData)
		.then(result => { Object(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */])('Updated meta data'); console.log(result); })
		.then(__WEBPACK_IMPORTED_MODULE_2__UI__["a" /* appendPre */].bind(null, 'Done!'))
		.catch(function(errorMsg) {
			//
			console.log(errorMsg);
		});
	} else {
		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';
	}
}

/**
 * Sign in the user upon button click
 */
function handleAuthClick(event) {

	gapi.auth2.getAuthInstance().signIn();
}

/**
 * Sign out the user upon button click.
 */
function handleSignoutClick(event) {
	gapi.auth2.getAuthInstance().signOut();
	Object(__WEBPACK_IMPORTED_MODULE_2__UI__["b" /* clearPre */])();
}


/**
 * Email JSON comes with alot of stuff we wont use. Only take what we need
 * @param {Email} email The emailData we'll be trimming
 * @return {LighterEmail} A new object with just the fields we'll be using
 */
function trimEmailJsonFat(email) {
	var headers = email.result.payload.headers;
	var lighterEmail = { date: null, from: null }; // Subject to expand as app grows in complexity
	for(var i = 0; i < headers.length; i++) {
		if(lighterEmail.data && lighterEmail.from)
			break;
		if(headers[i].name === 'Date')
			lighterEmail.date = headers[i].value;
		if(headers[i].name === 'From')
			lighterEmail.from = headers[i].value
	}
	// lighterEmail.labelName = email.result.labelName;
	return lighterEmail;
}

// Expose handleClientLoad to the window/global scope so that 
// google's script can run this onload
window.handleClientLoad = handleClientLoad;

/* Note:
	This app sort of has a blind spot. If an email scan is conducted on 9/9/2017,
		the sheet will record the last update timestamp as 9/9/2017.
		The next email scan will scan for emails after that date, so if a user
		were to apply to a job on the night of 9/9/2017, guess what?
		It wont be picked up by the query.

		Potential solutions:
			Once we're scanning emails by text analysis:
				we can mark scanned emails with 'processed' label and start our search on a day before the current day.
				That way, we might pick up already-processed emails but we'll know to not do anything with them because
				of their label.
			Now that I think about it, nothings really stopping me from using that strategy right now.
*/


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__UI__ = __webpack_require__(0);


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
				Object(__WEBPACK_IMPORTED_MODULE_0__UI__["a" /* appendPre */])('We have a sheet!');
				_sheetID = result.id;
				return resolve(result.id);
			} else {
				Object(__WEBPACK_IMPORTED_MODULE_0__UI__["a" /* appendPre */])('Couldnt find a sheet. Creating one for you...');
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
			Object(__WEBPACK_IMPORTED_MODULE_0__UI__["a" /* appendPre */])('Recorded new sent applications!');
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
	recordAppStatusesFromEmails: recordAppStatusesFromEmails
};


/* harmony default export */ __webpack_exports__["a"] = (SheetsAPI);



/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Util__ = __webpack_require__(4);


var _emails = {
	_apps_sent: null,
	_apps_rejected: null,
	_apps_interested: null
};

function loadEmailsAfter(date) {
	return scanAll(date);
}

function scanAll(date) {
	return new Promise(function(resolve, reject) {
		var promises = [
			getMessagesLabeled('apps-sent', date),
			getMessagesLabeled('apps-rejected', date),
			getMessagesLabeled('apps-interested', date)
		]
		Promise.all(promises)
		.then(dataSet => {
			_emails._apps_sent = dataSet[0]; 		// apps-sent
			_emails._apps_rejected = dataSet[1]; 	// apps-rejected
			_emails._apps_interested = dataSet[2]; 	// apps-interested
		})
		.then(() => resolve( getEmails() ) );
	});
}

function getEmails() {
	return {
		apps_sent: _emails._apps_sent, apps_rejected: _emails._apps_rejected, apps_interested: _emails._apps_interested
	};
}

function getMessagesLabeled(label, date) {
	return new Promise(function(resolve, reject) {
		var label_based_query = 'label:'+label;
		if(date) {
			label_based_query += ' after:' + __WEBPACK_IMPORTED_MODULE_0__Util__["a" /* default */].dateFormatter(date);
		}
		var apiParams = { userId: 'me', q: label_based_query, maxResults: 1000 };
		gapi.client.gmail.users.messages.list(apiParams)
		.then(response => { 
			var messageData = response.result.messages || [];
			return getMessagesByIds( messageData.map(msg => msg.id) ); 
		})
		.then(messages => {
			resolve(messages)
		});
	});
}

// Study this
function getMessagesByIds(ids) {
	return new Promise(function(resolve, reject) {
		if(ids.length === 0)
			return resolve([]);
		var ajaxCallsRemaining = ids.length;
		var max = ajaxCallsRemaining;
		var returnedData = [];

		for(var i = 0; i < ids.length; i++) {
			gapi.client.gmail.users.messages.get({ userId: 'me', id: ids[i] })
				.then(function(response) {
					returnedData.push(response);
					// console.log(response);
					--ajaxCallsRemaining;
					if(ajaxCallsRemaining <= 0) {
						return resolve(returnedData);
					}
				});
		}
	});
}

var MailAPI = {
	loadEmailsAfter: loadEmailsAfter,
	getMessagesByIds: getMessagesByIds,
	getEmails: getEmails
};

/* harmony default export */ __webpack_exports__["a"] = (MailAPI);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

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

/* harmony default export */ __webpack_exports__["a"] = (UtilAPI);

/***/ })
/******/ ]);