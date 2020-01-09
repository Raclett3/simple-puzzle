import * as gulp from "gulp";
import * as typescript from "gulp-typescript";
import * as webpack from "webpack";
import * as webpackStream from "webpack-stream";
import webpackConfig from "./webpack-config";

gulp.task("build-server", (done) => {
    const project = typescript.createProject("./src/tsconfig.json");
    project.src()
           .pipe(project())
           .pipe(gulp.dest("./build"));
    done();
});

gulp.task("build-client", (done) => {
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
