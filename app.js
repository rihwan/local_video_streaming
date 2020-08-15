var express = require('express');
var app = express();

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

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
            var video_path = path.join(curr_dir, files[i]);
            var image_path = path.join(curr_dir, 'screenshots', files[i]);
            image_path += '.jpg';

            var ext = video_path.split('.').pop();
            if (ext === 'mp4' || ext === 'mov' || ext === 'webm') {
                var type = '';
                if (ext === 'mp4' || ext === "mov") {
                    type = 'video/mp4';
                } else if (ext === 'webm') {
                    type = 'video/webm; codecs="vp9.0, opus"';
                }

                var video_filepath = video_path.substring(base_dir.length + 1);
                var image_filepath = image_path.substring(base_dir.length + 1);

                var image_file_exists = false;
                try {
                    if (fs.existsSync(image_path)) {
                        image_file_exists = true;
                    }
                } catch (err) {
                    console.error(err);
                }

                total_file_list.push({
                    'filename': files[i],
                    'video_filepath': video_filepath,
                    'image_filepath': image_filepath,
                    'image_file_exists': image_file_exists,
                    'type': type
                });
            } else {
                try {
                    if (fs.lstatSync(video_path).isDirectory()) {
                        dirs.push(video_path);
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

const NUM_FILES_PER_PAGE = 10;
const NUM_PAGES_TO_SHOW = 2;

var video_files = retrieveFiles(video_dir);
console.log('# of videos:' + video_files.length);

var get_address = function() {
    var address = 'http://' + hostname + ':' + port;
    return address;
};

var add_page_numbers = function(page_index) {
    var max_pages = (video_files.length + NUM_FILES_PER_PAGE - 1);
    max_pages /= NUM_FILES_PER_PAGE;
    max_pages = Math.floor(max_pages);

    var start_page_index = -1;
    var end_page_index = -1;
    if (page_index - NUM_PAGES_TO_SHOW < 0) {
        start_page_index = 0;
    } else {
        start_page_index = page_index - NUM_PAGES_TO_SHOW;
    }

    end_page_index = start_page_index + NUM_PAGES_TO_SHOW * 2;
    end_page_index = Math.floor(end_page_index);
    if (page_index + NUM_PAGES_TO_SHOW >= max_pages) {
        end_page_index = max_pages - 1;
        start_page_index = max_pages - 1 - NUM_PAGES_TO_SHOW * 2;
        start_page_index = Math.floor(start_page_index);
        if (start_page_index < 0) {
            start_page_index = 0;
        }
    }

    var first_page = 0;
    var last_page = max_pages - 1;

    var content = '<center><h1>';
    if (start_page_index > first_page) {
        content += '<a href="' + get_address() + '/?page_index=' + first_page;
        content += '">' + first_page + '</a>';
        content += '&nbsp;...&nbsp;';
    }

    for (var i = start_page_index; i <= end_page_index; ++i) {
        content += '<a href="' + get_address() + '/?page_index=' + i + '">'
        content += i + '</a>';
        content += '&nbsp;';
    }

    if (end_page_index < last_page) {
        content += '...&nbsp;';
        content += '<a href="' + get_address() + '/?page_index=' + last_page;
        content += '">' + last_page + '</a>';
    }
    content += '</h1></center>';

    return content;
};

app.get('/', function (req, res, next) {
    if (video_files.length === 0) {
        var content = '';
        content += '<html>\n';
        content += '  <head>\n';
        content += '    <meta charset="UTF-8">\n';
        content += '    <title>Local Video Streaming</title>\n';
        content += '    <link rel="stylesheet" type="text/css" href="';
        content += get_address() + '/css/style.css" />\n';
        content += '  </head>\n';
        content += '  <body>\n';
        content += '    <h2>No video files</h2>\n';
        content += '  </body>\n';
        content += '</html>\n';
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(content);
        res.end();
        return;
    }

    var max_pages = (video_files.length + NUM_FILES_PER_PAGE - 1);
    max_pages /= NUM_FILES_PER_PAGE;
    max_pages = Math.floor(max_pages);

    var page_index = 0;
    if (req.query && req.query.page_index) {
        page_index = parseInt(req.query.page_index);
    }

    if (page_index >= max_pages) {
        page_index = max_pages - 1;
    }

    var start_index = page_index * NUM_FILES_PER_PAGE;
    var end_index = start_index + NUM_FILES_PER_PAGE;
    if (end_index > video_files.length) {
        end_index = video_files.length;
    }

    var content = '';
    content += '<html>\n';
    content += '  <head>\n';
    content += '    <meta charset="UTF-8">\n';
    content += '    <title>Local Video Streaming</title>\n';
    content += '    <link rel="stylesheet" type="text/css" href="';
    content += get_address() + '/css/style.css" />\n';
    content += '  </head>\n';
    content += '  <body>\n';
    content += '    <div id="file_list">\n';
    content += '      <ul id="ann">\n';
    for (var i = start_index; i < end_index; ++i) {
        content += '      <li>';
        content += '<h3><a href="' + get_address();
        content += '/video_player/?index=' + i + '">';
        if (video_files[i].image_file_exists) {
            content += '<img src="' + get_address() + '/image/?index=' + i;
            content += '" width="300" height="200" /><br/>';
        }
        content += i + ': ' + video_files[i].video_filepath;
        content += '</a></h3></li>\n';
    }
    content += '        <li>' + add_page_numbers(page_index) + '</li>\n';
    content += '      </ul>\n';
    content += '      <br/><br/><br/><br/><br/><br/>';
    content += '    </div>\n';
    content += '  </body>\n';
    content += '</html>\n';

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(content);
    res.end();
});

app.get('/video_player', function (req, res, next) {
    var index = -1;
    if (req.query && req.query.index) {
        index = parseInt(req.query.index);
    }

    if (index >= 0 && index < video_files.length) {
        var content = '';
        content += '<html>\n';
        content += '  <head>\n';
        content += '    <meta charset="UTF-8">\n';
        content += '    <title>' + video_files[index].video_filepath;
        content += '</title>\n';
        content += '    <link rel="stylesheet" type="text/css" href="';
        content += 'http://' + hostname + ':' + port + '/css/style.css" />\n';
        content += '  </head>\n';
        content += '  <body>\n';
        content += '    <center>\n';
        content += '      <video id="videoPlayer" controls autoplay>\n';
        content += '        <source src="http://' + hostname + ':' + port;
        content += '/video/?index=' + index + '" type="';
        content += video_files[index].type + '">\n';
        content += '      </video>\n';
        content += '    </center>\n';
        content += '  </body>\n';
        content += '</html>\n';

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(content);
        res.end();
    } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('Unknown video file');
        res.end();
    }
});

app.get('/image', function (req, res, next) {
    var index = -1;
    if (req.query && req.query.index) {
        index = parseInt(req.query.index);
    }

    if (index >= 0 && index < video_files.length &&
        video_files[index].image_file_exists) {
        const filepath = path.join(video_dir,
            video_files[index].image_filepath);
        var s = fs.createReadStream(filepath);

        s.on('open', function () {
            res.setHeader('Content-Type', 'image/jpeg');
            s.pipe(res);
        });

        s.on('error', function () {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404;
            res.end('Not found');
        });
    } else {
        var empty_jpeg = path.join(__dirname, 'public/empty_jpeg.jpg');
        var s = fs.createReadStream(empty_jpeg);

        s.on('open', function () {
            res.setHeader('Content-Type', 'image/jpeg');
            s.pipe(res);
        });

        s.on('error', function () {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404;
            res.end('Not found');
        });
    }
});

app.get('/video', function (req, res, next) {
    var index = -1;
    if (req.query && req.query.index) {
        index = parseInt(req.query.index);
    }

    if (index >= 0 && index < video_files.length) {
        const filepath = path.join(video_dir,
            video_files[index].video_filepath);

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
