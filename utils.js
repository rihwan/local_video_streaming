// Utility functions.
var path = require('path');
var fs = require('fs');

const NUM_FILES_PER_PAGE = 9;

let config_file = process.argv[2];
const config = require(config_file);

var get_num_pages = function (video_files) {
  var max_pages = (video_files.length + NUM_FILES_PER_PAGE - 1);
  max_pages = max_pages / NUM_FILES_PER_PAGE;
  max_pages = Math.floor(max_pages);
  if (max_pages === 0) {
    max_pages = 1;
  }
  return max_pages;
};

var get_num_files_per_page = function () {
  return NUM_FILES_PER_PAGE;
};

var get_server_address = function () {
  var address = 'http://' + config.Server_IP + ':' + config.Server_Port;
  return address;
};

var write_404_page = function (res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.write('Not found');
  res.end();
};

var replace_all = function(str, search, replacement) {
  return str.split(search).join(replacement);
};

var read_page_template = function (file_path) {
  var content = fs.readFileSync(file_path, 'utf-8');
  content = replace_all(content, "```Title```", config.App_Title);
  var server_url = get_server_address();
  content = replace_all(content, "```ServerUrl```", server_url);
  content = replace_all(content, "```VideoDefault_Url```", server_url);
  return content;
};

var retrieve_video_files = function (base_dir) {
  console.log('Search video files from ' + base_dir);
  var total_file_list = [];

  var dirs = [];
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

  console.log('# of video files: ' + total_file_list.length);
  return total_file_list;
};

var should_allow_access = function (req) {
  if (!req || !req.ip) {
    console.log('Requested IP address does not exist.');
    return false;
  }

  if (config.Only_Allows_Local_Network_Access === true) {
    var partial_ip = String(req.ip).substring(0, 7);
    if (partial_ip !== '192.168') {
      console.log('Outside of local network tried to access: ' + partial_ip);
      return false;
    }
    return true;
  } else {
    return true;
  }
}

var add_page_number_content = function (
  server_addr_page, page_index, active_page_index, text) {
  var content = '';

  if (page_index == active_page_index) {
    content += '<li class="uk-active"><a href="';
  } else {
    content += '<li><a href="';
  }

  content += server_addr_page + page_index + '">';

  if (text === undefined) {
    content += page_index;
  } else {
    content += text;
  }

  content += '</a></li>\n';
  return content;
}

var get_page_numbers_content = function (video_files, page_index) {
  var num_pages = get_num_pages(video_files);

  var start_page_index = -1;
  var end_page_index = -1;
  if (page_index - config.Num_Pages_To_Show < 0) {
    start_page_index = 0;
  } else {
    start_page_index = page_index - config.Num_Pages_To_Show;
  }

  end_page_index = start_page_index + config.Num_Pages_To_Show * 2;
  end_page_index = Math.floor(end_page_index);
  if (page_index + config.Num_Pages_To_Show >= num_pages) {
    end_page_index = num_pages - 1;
    start_page_index = num_pages - 1 - config.Num_Pages_To_Show * 2;
    start_page_index = Math.floor(start_page_index);
    if (start_page_index < 0) {
      start_page_index = 0;
    }
  }

  console.log('Page range: ' + start_page_index + ':' + end_page_index);

  var server_addr_page = get_server_address() + '/?page_index=';

  var first_page = 0;
  var last_page = num_pages - 1;

  var content = '';
  if (start_page_index > first_page) {
    content += add_page_number_content(
      server_addr_page, first_page, page_index);
    if (first_page + 1 < start_page_index) {
      var middle_page = Math.floor((first_page + start_page_index + 1) / 2);
      content += add_page_number_content(
        server_addr_page, middle_page, page_index, '...');
    }
  }

  for (var i = start_page_index; i <= end_page_index; ++i) {
    content += add_page_number_content(server_addr_page, i, page_index);
  }

  if (end_page_index < last_page) {
    if (end_page_index + 1 < last_page) {
      var middle_page = Math.floor((end_page_index + last_page + 1) / 2);
      content += add_page_number_content(
        server_addr_page, middle_page, page_index, '...');
    }
    content += add_page_number_content(server_addr_page, last_page, page_index);
  }

  return content;
};

module.exports = {
  get_server_address: get_server_address,
  retrieve_video_files: retrieve_video_files,
  should_allow_access: should_allow_access,
  get_page_numbers_content: get_page_numbers_content,
  read_page_template: read_page_template,
  get_num_pages: get_num_pages,
  get_num_files_per_page: get_num_files_per_page,
  replace_all: replace_all,
  write_404_page: write_404_page
};