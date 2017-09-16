import Util from './Util';

/**
 * Email JSON comes with alot of stuff we wont use. Only take what we need
 * @param {Email} email The emailData we'll be trimming
 * @return {LighterEmail} A new object with just the fields we'll be using
 */
export function trimEmailJsonFat(email) {
	var headers = email.result.payload.headers;
	var snippet = email.result.snippet;
	var lighterEmail = { date: null, from: null, snippet: snippet }; // Subject to expand as app grows in complexity
	for(var i = 0; i < headers.length; i++) {
		if(lighterEmail.data && lighterEmail.from)
			break;
		if(headers[i].name === 'Date')
			lighterEmail.date = headers[i].value;
		if(headers[i].name === 'From')
			lighterEmail.from = headers[i].value
	}
	return lighterEmail;
}

function prettifyFromLinkedIn(email) {
	var split = email.snippet.split('Good luck!');
	var split2 = split[1].split('Applied');
	var newFrom = split2[0].trim();
	email.from = newFrom;
}

function prettifyFromWithLTGT(email) {
	var originalFrom = email.from;
	var split = email.from.split(/<.*>/);
	// only want to change email.from if <.*> doesnt comprise the entire from header - very rare case
	if(!(split[0] === '' && split[1] === ''))
		email.from = split[0];
	else
		email.from = email.from.substr(1, email.from.length - 2);
}

function prettifyFromWithNoReply(email) {
	var split = email.from.split(/no.*reply@/);
	if(split[0] === '')
		email.from = split[1];
	else
		email.from = split[0];
}

function prettifyFromWithQuotes(email) {
	var newFrom = email.from.split('"').join('');
	email.from = newFrom;
}

export function prettifyFromHeaders(email) {
	var from = email.from;
	// handle linkedin 
	if(from === 'LinkedIn <jobs-listings@linkedin.com>')
		prettifyFromLinkedIn(email);
	else if(/<.*>/.test(from))
		prettifyFromWithLTGT(email);
	
// Consider these more like clean up
	// remove surrounding quotes
	if(/^".*"/.test(email.from))
		prettifyFromWithQuotes(email);
	if(/no.*reply@/.test(email.from))
		prettifyFromWithNoReply(email);
	return email;
}

export function prettifyDateHeader(email) {
	// console.log(email.date, typeof email.date);
	// console.log(new Date(email.date));
	email.date = Util.sheetFriendlyDateFromatter(new Date(email.date));
	return email;
}