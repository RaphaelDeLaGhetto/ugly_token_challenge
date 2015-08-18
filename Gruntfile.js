'use strict';
//require('./index');

var port = process.env.PORT || 3333;

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /**
         * jasmine_node
         */
        jasmine_node: {
            options: {
                forceExit: true,
                host: 'http://localhost:' + port + '/',
                match: '.',
                matchall: false,
                extensions: 'js',
                specNameMatcher: '[sS]pec'
            },
            all: []
        },

        /**
         * jshint
         */
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            index: {
                src: 'index.js'
            },
            spec: {
                src: ['spec/**/*.js']
            },
        },
      });

    /**
     * Load the plugins
     */
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    /**
     * Default task(s).
     */
    grunt.registerTask('default', ['jshint']);

    /**
     * Jasmine unit tests
     */
    grunt.registerTask('test', ['jasmine_node']);
};
