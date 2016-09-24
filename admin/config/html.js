module.exports.tasks = {
  // clean generated files
  clean: {
    html: [
      '<%= paths.htmlAssets %>'
    ]
  },

  concat: {
    html: {
      files: {
        '<%= paths.htmlAssets %>/js/vendors.min.js': [
          '<%= paths.app %>/bower_components/jquery/dist/jquery.min.js',
          '<%= paths.app %>/bower_components/moment/min/moment.min.js',
          '<%= paths.app %>/bower_components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
          '<%= paths.app %>/bower_components/bootstrap-sass/assets/javascripts/bootstrap.js',
          '<%= paths.app %>/bower_components/bootstrap3-typeahead/bootstrap3-typeahead.js',
          '<%= paths.app %>/bower_components/summernote/dist/summernote.js',
          '<%= paths.app %>/bower_components/hammerjs/hammer.js',
          '<%= paths.app %>/bower_components/jquery-hammerjs/jquery.hammer.js',
          '<%= paths.app %>/bower_components/jquery-file-upload/js/vendor/jquery.ui.widget.js',
          '<%= paths.app %>/bower_components/jquery-file-upload/js/jquery.iframe-transport.js',
          '<%= paths.app %>/bower_components/jquery-file-upload/js/jquery.fileupload.js',
          '<%= paths.app %>/bower_components/velocity/velocity.js',
          '<%= paths.app %>/bower_components/d3/d3.js',
          '<%= paths.app %>/bower_components/c3/c3.js',
          '<%= paths.app %>/bower_components/bower-jvectormap/jquery-jvectormap-1.2.2.min.js',
          '<%= paths.app %>/bower_components/bower-jvectormap/jquery-jvectormap-world-mill-en.js',
          '<%= paths.app %>/bower_components/select2/dist/js/select2.full.js',
          '<%= paths.app %>/bower_components/nouislider/distribute/jquery.nouislider.js',
          '<%= paths.app %>/bower_components/gmaps/gmaps.js',
          '<%= paths.app %>/bower_components/datatables/media/js/jquery.dataTables.js',
          '<%= paths.app %>/bower_components/bootstrap-validator/dist/validator.js',
        ],
        '<%= paths.htmlAssets %>/js/app.min.js': [
          '<%= paths.assets %>/js/vendors/side-nav.js',
          '<%= paths.assets %>/js/vendors/ripples.js',
          '<%= paths.assets %>/js/colors.js',
          '<%= paths.html %>/src/js/**/*.js',
        ],
        '<%= paths.htmlAssets %>/css/vendors.min.css': [
          '<%= paths.app %>/bower_components/material-design-iconic-font/css/material-design-iconic-font.css',
          '<%= paths.app %>/bower_components/c3/c3.css',
          '<%= paths.app %>/bower_components/bower-jvectormap/jquery-jvectormap-1.2.2.css',
          '<%= paths.app %>/bower_components/bootstrap-additions/dist/bootstrap-additions.css',
          '<%= paths.app %>/bower_components/summernote/dist/summernote.css',

          '<%= paths.app %>/bower_components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css',
          '<%= paths.app %>/bower_components/jquery-file-upload/css/jquery.fileupload.css',
          '<%= paths.app %>/bower_components/select2/dist/css/select2.min.css',
        ],
        '<%= paths.htmlAssets %>/css/styles.min.css': [
          '<%= paths.assets %>/css/materialism.css',
          '<%= paths.assets %>/css/select2.css',
          '<%= paths.assets %>/css/helpers.css',
          '<%= paths.assets %>/css/ripples.css',
          '<%= paths.html %>/src/css/*.css',
        ]
      }
    }
  },

  // copy files to correct folders
  copy: {
    html: {
      files: [
        { expand: true, src: '**/*', cwd: '<%= paths.distAssets %>/fonts', dest: '<%= paths.htmlAssets %>/fonts' },
        { expand: true, src: '**/*', cwd: '<%= paths.distAssets %>/img',   dest: '<%= paths.htmlAssets %>/img' },
      ]
    }
  },

  uglify: {
    html: {
      files: {
        '<%= paths.htmlAssets %>/js/vendors.min.js': ['<%= paths.htmlAssets %>/js/vendors.min.js'],
        '<%= paths.htmlAssets %>/js/app.min.js': ['<%= paths.htmlAssets %>/js/app.min.js']
      }
    }
  },

  cssmin: {
    html: {
      files: [{
        expand: true,
        cwd: '<%= paths.htmlAssets %>/css',
        src: ['*.css'],
        dest: '<%= paths.htmlAssets %>/css'
      }]
    }
  },
};
