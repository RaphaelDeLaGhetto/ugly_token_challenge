'use strict';
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        /**
         * uglify
         */
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
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
//            apps: {
//                src: ['app/**/*.js']
//            },
//            config: {
//                src: ['config/**/*.js']
//            },
//            lib: {
//                src: ['lib/**/*.js']
//            },
//            routes: {
//                src: ['routes/**/*.js']
//            },
            spec: {
                src: ['spec/**/*.js']
            },
        },
      });

    /**
     * Load the plugin that provides the "uglify" task.
     */
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    /**
     * Default task(s).
     */
    grunt.registerTask('default', ['uglify']);
};
