module.exports = {
	entry: './public/js/googleApiApp.js',
	output: {
		path: __dirname + '/build/',
		filename: 'bundle.js',
		publicPath: '/build/'
	},
	devServer: {
		inline: true,
		port: 3000
	}
};