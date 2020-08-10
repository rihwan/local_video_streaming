var express = require('express');
var app = express();

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/favicon.ico', (req, res) => res.status(204));

app_title = 'Local Video Streaming';

var retrieveFiles = function(base_dir) {
    total_file_list = []

    var dirs = []
    dirs.push(base_dir);

    while (dirs.length != 0) {
        curr_dir = dirs.pop();
        var files = fs.readdirSync(curr_dir);
        for (var i = 0; i < files.length; ++i) {
            var curr_path = path.join(curr_dir, files[i]);

            var ext = curr_path.split('.').pop();
            if (ext === 'mp4' || ext === 'mkv' || ext === 'mov') {
                var type = '';
                if (ext === 'mp4' || ext === "mov") {
                    type = 'video/mp4';
                } else if (ext === 'mkv') {
                    // type = 'video/matroska; codec="theora, vorbis"';
                    type = 'video/mp4';
                } else if (ext === 'webm') {
                    type = 'video/webm; codecs="vp9.0, opus"';
                }

                var relative_path = curr_path.substring(base_dir.length + 1);

                total_file_list.push({
                    'relative_path': relative_path,
                    'type': type
                });
            } else {
                try {
                    if (fs.lstatSync(curr_path).isDirectory()) {
                        dirs.push(curr_path);
                    }
                } catch (err) {
                    console.log('Invalid');
                }
            }
        }
    }

    return total_file_list;
};

let hostname = process.argv[2];
let port = process.argv[3];
let video_dir = process.argv[4];
console.log('video directory:', video_dir);
var video_files = retrieveFiles(video_dir);
console.log('# of videos:' + video_files.length);

app.get('/', function (req, res, next) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    var content = '<html><head><title>Local Video Streaming</title></head><body>';
    for (var i = 0; i < video_files.length; ++i) {
        var curr_content = '<a href="http://';
        curr_content += hostname + ':' + port + '/video/?index=' + i + '">';
        curr_content += i + ': ' + video_files[i].relative_path + '</a><br />';
        content += curr_content;
    }
    content += '</body></html>';
    res.write(content);
    res.end();
});

app.get('/video', function (req, res, next) {
    var index = -1;
    if (req.query && req.query.index) {
        index = parseInt(req.query.index);
    }

    if (index >= 0 && index < video_files.length) {
        const filepath = path.join(video_dir,
            video_files[index].relative_path);

        const stat = fs.statSync(filepath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;
            const chunksize = (end-start) + 1;
            const file = fs.createReadStream(filepath, {start, end});
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Range': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': video_files[index].type
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': video_files[index].type
            };
            res.writeHead(200, head);
            fs.createReadStream(filepath).pipe(res);
        }
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('Unknown video file');
        res.end();
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('ERROR: ' + err.message);
    res.end();
});

module.exports = app;
