/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['src/*.js', 'src/charts/*.js','plugins/*.js'],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      all: {
        src: [
          "src/**/*.js", "Gruntfile.js", "test/**/*.js"
        ],
        options: {
          jshintrc: true
        }
      }
    },
    qunit: {

      files: ['test/index.html']
    },
    bowercopy: {
      options: {
        clean: true
      },
      
      tests: {
        options: {
          destPrefix: "test/libs"
        },
        files: {
          "qunit": "qunit/qunit",
          "d3.js": "d3/d3.js"           
        }
      },
      libs: {
        options: {
          destPrefix: "libs"
        },
        files: {
          "d3.js": "d3/d3.js"           
        }
      }
    },
    watch: {
     
        files: '<%= jshint.all.src %>',
        tasks: ['bowercopy', 'concat', 'uglify']
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bowercopy');


  // Default task.
  //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
  //grunt.registerTask('default', ['bowercopy', 'jshint', 'concat', 'uglify']);
  grunt.registerTask('default', ['bowercopy',  'concat', 'uglify']);

};
