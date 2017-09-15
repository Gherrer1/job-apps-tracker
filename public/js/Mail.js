import Util from './Util';

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
			label_based_query += ' after:' + Util.dateFormatter(date);
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

export default MailAPI;
