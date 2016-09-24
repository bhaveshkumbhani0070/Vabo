# Materialism documentation

Hello and welcome to the Materialism documentation.  
Get a overview of the theme and how to set things up as we intended it for you.

#### Requirements

For fast and streamlined development we have set up this project using Node, Grunt and Bower.  
Please install these requirements to enjoy the full potential of this theme.

#### Node

First make sure you have [Node.js](https://nodejs.org/ "Node.js") installed.  
When you have successfuly installed Node you should see something similar when running the commands:

```sh
$ node --version
v5.1.1
$ npm --version
3.5.1
```

#### Grunt and Bower

Now that we have Node and NPM we can install Grunt and Bower which will help us compile (CSS), uglify (JS) and do all sort of usefull tasks.

```sh
$ npm install -g grunt-cli bower
```

#### Install requirements for Materialism with Grunt and Bower

With Bower you download the required assets (Angular, Bootstrap etc) and with NPM you download the Grunt dependencies (SASS).

```sh
$ cd /to/path/where Gruntfile.js and bower.json are located
$ npm install
$ bower install
```

Sometimes when running Bower a version mismatch can occur between certain assets. When this happens for Angular always choose the version used by Materialism.

```sh
Unable to find a suitable version for angular, please choose one:
    1) angular#~1.3 which resolved to 1.3.20 and is required by c3-angular#0.7.1
    2) angular#1.4.8 which resolved to 1.4.8 and is required by angular-animate#1.4.8
    3) angular#^1.2 which resolved to 1.4.8 and is required by angular-simple-logger#0.0.4
    4) angular#1.2 - 1.4 which resolved to 1.4.8 and is required by angular-google-maps#2.2.1

Prefix the choice with ! to persist it to bower.json

? Answer 2
```

In this case we awnser with: 2

> **From here on out when we mention to run a command, do so from the project root (Where Gruntfile.js is located).**


## Development

#### Viewing the theme

To view the theme start a local webserver with grunt using:

```sh
$ grunt
```

This will start a local webserver on port 9000. Open one of the following urls in your browser:

- http://localhost:9000/index.dev.html
- http://localhost:9000/dist/index.html

#### Workflow

The project is divided into two parts `dist` and `source`.  
The `dist` is the compiled version of the `source`.  
When you are looking for examples take a look at the `dist` version.

#### Making changes

You can use the grunt tasks to develop your own application. To make changes and automatically compile your CSS run:

```sh
$ grunt
```

When you are done for a distribution of your own version run:

```sh
$ grunt dist
```

This will copy all the required assets to `dist/` and compile the CSS and JS.  
In the final step everything will be compressed into a zip file.

#### Modifying compiled assets (Usemin)

When you start your project you may want to choose which assets are compiled into your project.  
We have chosen to use `grunt-usemin` for this task. When you have a look at `index.dev.html` you will see something like this:

```html
<!-- build:js assets/js/vendors.min.js -->
<script charset="utf-8" src="/bower_components/angular/angular.js"></script>
<!-- endbuild -->
```

This will create the file `dist/assets/js/vendors.min.js` minified, uglified and hashed when running the `grunt dist` task.  
We provide four of these files for you: `vendors.min.js`, `app.min.js`, `vendors.min.css` and `styles.min.css`.  
And you are free to modify them to your pleasing.  
You are also free to name the files whatever you want. Usemin will automatically pick this up and use that filename.

#### Modifying compiled SCSS

For this theme we use a SCSS index file which gets recompiled every time you make a change to one of the SCSS files.  
But only while you are running `grunt`, because this will watch for changes.  
You can find this file in `app/assets/css/scss/materialism.scss`

#### Directory structure

- app
  - assets
    - css
      - sass                              (sass files need for Materialism)
        - animations                      (Custom animations)
        - apps                            (Styling for our apps)
        - directives                      (Styling for our directives)
        - materialism                     (Base styling elements for Materialism)
        - pages                           (Styling for specific pages)
        - plugins                         (Styling for plugins / vendors)
        - materialism.scss                (Index file for Materialism)
      - materialism.css                   (Generated file based off of materialism.scss)
    - js
      - controllers                       (Angular controllers)
      - directives                        (Angular directives)
      - services                          (Services used by Materialism)
      - vendors                           (Vendors without proper Bower package or custom component)
      - app.js                            (Defines the included modules)
    - tpl                                 (HTML files for Materialism)
  - bower_components                      (Vendors, you can ignore this directory)
  - dist
    - assets                              (Copied and compiled assets for the distributed version)
    - pages                               (Static pages)
  - html                                  (Compiled HTML version of Materialism)
  - pages                                 (Static pages)
  - index.dev.html                        (Source index html)
- config                                  (Grunt configs)
- node_modules                            (Modules used by node)

## Layout, Navigation and partials

If you go to the directory `app/assets/tpl` you'll find the html files that are used in this theme.  
The templates are separated by folders which corresponds to the navigational namings.

#### Layout

The main layout file is located in app/index.dev.html This file is for development purposes and  
will be used when the grunt tasks minimize your application for production and send to the dist file.
  
#### Navigation and partials

Looking at `app/assets/tpl` you'll need to change partials/sidebar for navigational items.  
The following maps are shared: directives, partials  
Don't discard these if you are not sure starting your own application.  

## CSS development with SASS

[SASS](http://sass-lang.com/) offers the most functionality in regards to css frameworks and that's why we've chosen to work with SASS.  
Although there are still some static CSS files used in the theme, most of it is written in SASS.

#### SASS structure

Looking at `app/assets/css/` you'll see a sass folder and some css files.  
The css files are static files used from plugins that didn't supply SASS files or are custom.  
See `directory structure` for information on the files.

`materialism.scss` is the base for your application css.  
All files are included here and you'll probably need to customize this file for your specific wishes.  
The `pages` folder is something that is used for showcasing the theme and is a good base for your own application pages.

#### helpers.css

We like writing clean CSS and clean is reusing code.  
The `helpers.css` file is a swiss army knife for quickly prototyping your application.  
Take a look at this file because it's static, there are a lot of handy classes that extend bootstrap functionality.  
For instance `m-r-5` is margin-top: 5px; or `p-t-20` is padding-top: 20px;  
Add these classes to any element like:  
`<div class="m-t-30 m-b-5">My awesomely spaced content</div>`

#### CSS colors

If you look at the [colors](http://localhost:9000/index.dev.html#/ui-elements/colors) page, you can see a rich variety of colors and how to use them.  
Text colors are automatically calculated based on the intensity of the background color but can also be set manually.  

Here a quick example:  
`<div class="red lighten-1">my very own red box with white text</div>`

## FAQ

#### Errors with npm or bower

When you are experiencing errors with `npm` or `bower` most of these problems are solved by doing a clean install.
Remove the following directories `bower_components` and `node_modules` and run

```sh
$ cd /to/path/where Gruntfile.js and bower.json are located
$ npm install
$ bower install
```

Sometimes you'll need to remove your cached versions of `npm` also by removing the `.npm` directory in your home folder.  

#### Grunt errors

Grunt uses libraries maintained by other developers which tend to change paths.  
When grunt gives you an error about not finding a file inside the `bower_components` folder you should check  
if the requested file is present and if not, it is probably moved so you need to change the path in `materialism.scss`

## Used libraries and plugins documentation

For this theme we use a set of existing tools with each offering their own extensive documentation.  
Having good knowledge in these packages will greatly help you develop with this theme.

#### Bootstrap

[Bootstrap](http://getbootstrap.com/) is the base for this theme.  
Also, we use the [SASS version of bootstrap](https://github.com/twbs/bootstrap-sass).  
We have also added [Angular Strap](http://mgcrea.github.io/angular-strap/) to provide Angular with directives for Bootstrap.

#### SASS

[SASS](http://sass-lang.com/) is a CSS extension which lets you write clean and modular CSS.

#### Angular

[Angular](https://angularjs.org/) is the JS framework.

#### Node.js

[Node.js](https://nodejs.org) is what we use to compile SASS into CSS or run a local webserver.  
When you look at `package.json` you'll see which Node packages we are using for this theme.

#### Grunt

[Grunt](http://gruntjs.com/) is what allows us to create automated tasks which helps you with development.  
Have a look at the `Gruntfile.js` to see which tasks we have defined for you.

#### Bower

[Bower](http://bower.io/) is the package manager we use so you can easily update your dependencies.  
See `bower.json` for which dependencies we have included.

#### C3

Charting is done with [C3](http://c3js.org/) in combination with [C3 Angular](https://github.com/jettro/c3-angular-directive).


#### Misc plugins used and documentation links
[Angular animate](https://github.com/angular/bower-angular-animate)  
[Angular auto validate](http://jonsamwell.github.io/angular-auto-validate/)  
[Angular cookies](https://github.com/angular/bower-angular-cookies)  
[Angular elastic – Auto grow textarea’s](http://monospaced.github.io/angular-elastic/)  
[Angular file upload](https://github.com/danialfarid/ng-file-upload)  
[Angular google maps – Google maps directives](http://angular-ui.github.io/angular-google-maps/#!/)  
[Angular loading bar](http://chieffancypants.github.io/angular-loading-bar/)  
[Angular local storage](http://gregpike.net/demos/angular-local-storage/demo/demo.html)  
[Angular motion – Fancy CSS3 animations for Angular](http://mgcrea.github.io/angular-motion/)  
[Angular table – Table directive](http://bazalt-cms.com/ng-table/)  
[Angular route](https://github.com/angular/bower-angular-route)  
[Angular sanitize](https://github.com/angular/bower-angular-sanitize)  
[Angular smooth scroll](https://github.com/d-oliveros/angular-smooth-scroll)  
[Angular strap – Bootstrap directives](http://mgcrea.github.io/angular-strap)  
[Angular ui-select – Select2 directives](https://github.com/angular-ui/ui-select)  
[CSS animations – SCSS version of animate.css](https://github.com/benhodgson87/animate.scss)  
[Bootstrap additions](https://github.com/mgcrea/bootstrap-additions)  
[Bootstrap – SASS version](https://github.com/twbs/bootstrap-sass)  
[jVectorMap](http://jvectormap.com/)  
[C3 Angular Directive – C3 directives](http://jettro.github.io/c3-angular-directive/)  
[Fontawesome](http://fontawesome.io)  
[Hammer.js – Touch gestures](http://hammerjs.github.io/)  
[jQuery](http://jquery.com/)  
[jQuery Hammer.js](https://github.com/hammerjs/jquery.hammer.js)  
[Lodash](https://github.com/lodash/lodash)  
[Material design iconic font – Material design icons](http://zavoloklom.github.io/material-design-iconic-font/)      
[noUiSlider – Range slider](http://refreshless.com/nouislider/)  
[Roboto font](https://github.com/choffmeister/roboto-fontface-bower)  
[SHA-1 – SHA-1 hash generator](https://github.com/linkgod/SHA-1)  
[textAngular – Lightweight Angular.js Text-Editor](http://textangular.com/)  
[Velocity.js – Accelerated JavaScript animation](http://velocityjs.org)  
[Waypoints – Execute a function when you scroll to an element](http://imakewebthings.com/waypoints/)  
[Weather icons](http://erikflowers.github.io/weather-icons/)  
[Pic Jumbo – Free stock photos](http://picjumbo.com)  
[Ballicons – 30 pixel-perfect colorful icons](http://tympanus.net/codrops/2014/10/27/freebie-ballicons-2-vol-2/)  