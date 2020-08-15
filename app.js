var express = require('express');
var app = express();

var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var utils = require('./utils');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

let config_file = process.argv[2];
console.log('Config File in app: ' + config_file);
const config = require(config_file);
var video_files = utils.retrieve_video_files(config.Local_Video_Directory);

app.get('/favicon.ico', (req, res) => res.status(204));

// Index page shows title / video screenshots and pages.
app.get('/', function (req, res, next) {
  if (!utils.should_allow_access(req)) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Access Restricted');
    res.end();
    return;
  }

  if (video_files.length === 0) {
    var content = '';
    content += '<html>\n';
    content += '  <head>\n';
    content += '    <meta charset="UTF-8">\n';
    content += '    <title>' + config.App_Title + '</title>\n';
    content += '    <link rel="stylesheet" type="text/css" href="';
    content += utils.get_server_address() + '/css/style.css" />\n';
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

  var max_pages = (video_files.length + config.Num_Files_Per_Page - 1);
  max_pages /= config.Num_Files_Per_Page;
  max_pages = Math.floor(max_pages);

  var page_index = 0;
  if (req.query && req.query.page_index) {
    page_index = parseInt(req.query.page_index);
  }

  if (page_index >= max_pages) {
    page_index = max_pages - 1;
  }

  var start_index = page_index * config.Num_Files_Per_Page;
  var end_index = start_index + config.Num_Files_Per_Page;
  if (end_index > video_files.length) {
    end_index = video_files.length;
  }

  var content = '';
  content += '<html>\n';
  content += '  <head>\n';
  content += '    <meta charset="UTF-8">\n';
  content += '    <title>' + config.App_Title + '</title>\n';
  content += '    <link rel="stylesheet" type="text/css" href="';
  content += utils.get_server_address() + '/css/style.css" />\n';
  content += '  </head>\n';
  content += '  <body>\n';
  content += '    <div id="file_list">\n';
  content += '      <ul id="ann">\n';
  for (var i = start_index; i < end_index; ++i) {
    content += '      <li>';
    content += '<h3><a href="' + utils.get_server_address();
    content += '/video_player/?index=' + i + '">';
    if (video_files[i].image_file_exists) {
      content += '<img src="' + utils.get_server_address() + '/image/?index=';
      content += i + '" width="300" height="200" /><br/>';
    }
    content += i + ': ' + video_files[i].video_filepath;
    content += '</a></h3></li>\n';
  }
  content += '      </ul>\n';
  content += '      <ul id="page">\n';
  content += '        <li>';
  content += utils.get_page_numbers_content(video_files, page_index);
  content += '</li>\n';
  content += '      </ul>\n';
  content += '      <br/><br/><br/><br/><br/><br/><br/>';
  content += '      <br/><br/><br/><br/><br/><br/><br/>';
  content += '      <br/><br/><br/><br/><br/><br/><br/>';
  content += '    </div>\n';
  content += '  </body>\n';
  content += '</html>\n';

  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(content);
  res.end();
});

// Retrieving video player html page based on video index.
app.get('/video_player', function (req, res, next) {
  if (!utils.should_allow_access(req)) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Access Restricted');
    res.end();
    return;
  }

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
    content += utils.get_server_address() + '/css/style.css" />\n';
    content += '  </head>\n';
    content += '  <body>\n';
    content += '    <center>\n';
    content += '      <video id="videoPlayer" controls autoplay>\n';
    content += '        <source src="';
    content += utils.get_server_address();
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
    res.write('Not found');
    res.end();
  }
});

// Retrieving screenshot images based on index.
app.get('/image', function (req, res, next) {
  if (!utils.should_allow_access(req)) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Access Restricted');
    res.end();
    return;
  }

  var index = -1;
  if (req.query && req.query.index) {
    index = parseInt(req.query.index);
  }

  if (index >= 0 && index < video_files.length &&
    video_files[index].image_file_exists) {
    const filepath = path.join(config.Local_Video_Directory,
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

// Video streaming based on index.
app.get('/video', function (req, res, next) {
  if (!utils.should_allow_access(req)) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Access Restricted');
    res.end();
    return;
  }

  var index = -1;
  if (req.query && req.query.index) {
    index = parseInt(req.query.index);
  }

  if (index >= 0 && index < video_files.length) {
    const filepath = path.join(config.Local_Video_Directory,
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
      res.write('Not found');
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
