var JobApp = require('./models/jobApp');

var companies = ['Shutterstock', 'Google', 'Zappos', 'Apple', 'ESPN', 'Monkey', 'Pelican', 'MongoDB', 'Microsoft', 'Etsy'];
var positions = ['SWE', 'Javascript Developer', 'Node.js engineer', 'Full Stack Developer', 'Junior Web Developer'];
var statuses = ['application sent', 'rejected', 'initial', 'onsite'];

var applications = [];
for(let c_i = 0, p_i = 0, s_i = 0; c_i < companies.length; c_i++, p_i++, s_i++) {
	if(p_i >= positions.length) 
		p_i = 0;
	if(s_i >= statuses.length)
		s_i = 0;
	applications.push(new JobApp({ company: companies[c_i], applied_on: new Date(), status: statuses[s_i], position: positions[p_i] }));
}

module.exports = applications;

console.log(applications);