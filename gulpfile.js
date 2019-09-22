const gulp = require("gulp");
const typescript = require("gulp-typescript");
const webpack = require("webpack");
const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack-config");

gulp.task("build-server", function(done) {
    const project = typescript.createProject("./src/tsconfig.json");
    project.src()
           .pipe(project())
           .pipe(gulp.dest("./build"))
    done();
});

gulp.task("build-client", function(done) {
    webpackStream(webpackConfig, webpack)
        .pipe(gulp.dest("./build/client"));
    gulp.src(["./src/client/static/*"])
        .pipe(gulp.dest("./build/client"));
    done();
});

gulp.task("build", gulp.parallel([
    gulp.task("build-server"),
    gulp.task("build-client")
]));

gulp.task("default", gulp.task("build"));
