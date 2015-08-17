'use strict';

var	port = process.env.PORT || 3333;

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /**
         * connect
         */
        connect: {
            server: {
                options: {
                    port: port,
                }
            }
        },

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
                specNameMatcher: 'spec'
            },
            all: ['spec/']
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
     * Load the plugin that provides the "uglify" task.
     */
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    /**
     * Default task(s).
     */
    grunt.registerTask('default', ['jshint']);

    /**
     * Jasmine unit tests
     */
    grunt.registerTask('test', ['connect','jasmine_node']);
};
