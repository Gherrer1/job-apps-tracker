/**
 * Exports a Constructor function to create a Job Application
 */
module.exports = function JobApplication(params) {
	this.company = params.company;
	this.applied_on = params.applied_on;
	this.position = params.position;
	this.status = params.status;
}