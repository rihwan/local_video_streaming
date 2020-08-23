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

const video_page_file = path.join(__dirname, 'views/video_page_template.html');
const video_webpage_template = utils.read_page_template(video_page_file);

app.get('/favicon.ico', (req, res) => res.status(204));

// Index page shows title / video screenshots and pages.
app.get('/', function (req, res, next) {
  if (!utils.should_allow_access(req)) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('Access Restricted');
    res.end();
    return;
  }

  var num_files_per_page = utils.get_num_files_per_page();
  var num_pages = utils.get_num_pages(video_files);

  var page_index = 0;
  if (req.query && req.query.page_index) {
    page_index = parseInt(req.query.page_index);
  }

  if (page_index >= num_pages) {
    page_index = num_pages - 1;
  }

  var start_index = page_index * num_files_per_page;
  var end_index = start_index + num_files_per_page;
  if (end_index > video_files.length) {
    end_index = video_files.length;
  }

  // Copy video webpage template.
  var content = video_webpage_template;
  var page_contents = utils.get_page_numbers_content(video_files, page_index);
  content = utils.replace_all(content, "```Pages```", page_contents);

  for (var i = start_index; i < end_index; ++i) {
    var index = i - start_index;
    var image_url_search = "```Image" + index + "_Url```";
    var video_url_search = "```Video" + index + "_Url```";
    var video_caption_search = "```Video" + index + "_Caption```";

    var target_image_url = utils.get_server_address();
    target_image_url += '/image/?index=' + i;
    var target_video_url = utils.get_server_address();
    target_video_url += '/video_player/?index=' + i;

    content = utils.replace_all(content, image_url_search, target_image_url);
    content = utils.replace_all(content, video_url_search, target_video_url);
    content = utils.replace_all(content, video_caption_search,
      video_files[i].filename);
  }

  var num_files_per_page = utils.get_num_files_per_page();
  if (end_index - start_index < num_files_per_page) {
    var relative_start = end_index - start_index;
    for (var rel_i = relative_start; rel_i < num_files_per_page; ++rel_i) {
      var i = start_index + rel_i;
      var index = i - start_index;
      var image_url_search = "```Image" + index + "_Url```";
      var video_url_search = "```Video" + index + "_Url```";
      var video_caption_search = "```Video" + index + "_Caption```";

      var target_image_url = utils.get_server_address();
      target_image_url += '/image/?index=' + i;
      var target_video_url = utils.get_server_address();
      target_video_url += '/video_player/?index=' + i;

      content = utils.replace_all(content, image_url_search, target_image_url);
      content = utils.replace_all(content, video_url_search, '#');
      content = utils.replace_all(content, video_caption_search, 'No video');
    }
  }

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
    var content = '<!DOCTYPE html>\n';
    content += '<html>\n';
    content += '  <head>\n';
    content += '    <meta charset="UTF-8">\n';
    content += '    <title>' + video_files[index].video_filepath;
    content += '</title>\n';
    content += '    <link rel="stylesheet" type="text/css" href="';
    content += utils.get_server_address() + '/css/video_style.css" />\n';
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
    return utils.write_404_page(res);
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
      return utils.write_404_page(res);
    });
  } else {
    var no_image_jpeg = path.join(__dirname, 'public/images/no_image.jpg');
    var s = fs.createReadStream(no_image_jpeg);

    s.on('open', function () {
      res.setHeader('Content-Type', 'image/jpeg');
      s.pipe(res);
    });

    s.on('error', function () {
      return utils.write_404_page(res);
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
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
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
      return utils.write_404_page(res);
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
