// Utility functions.
var path = require('path');
var fs = require('fs');

let config_file = process.argv[2];
const config = require(config_file);

var get_server_address = function () {
  var address = 'http://' + config.Server_IP + ':' + config.Server_Port;
  return address;
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

module.exports = {
  get_server_address: get_server_address,
  retrieve_video_files: retrieve_video_files,
  should_allow_access: should_allow_access,
  get_page_numbers_content: function (video_files, page_index) {
    var max_pages = (video_files.length + config.Num_Files_Per_Page - 1);
    max_pages /= config.Num_Files_Per_Page;
    max_pages = Math.floor(max_pages);

    var start_page_index = -1;
    var end_page_index = -1;
    if (page_index - config.Num_Pages_To_Show < 0) {
      start_page_index = 0;
    } else {
      start_page_index = page_index - config.Num_Pages_To_Show;
    }

    end_page_index = start_page_index + config.Num_Pages_To_Show * 2;
    end_page_index = Math.floor(end_page_index);
    if (page_index + config.Num_Pages_To_Show >= max_pages) {
      end_page_index = max_pages - 1;
      start_page_index = max_pages - 1 - config.Num_Pages_To_Show * 2;
      start_page_index = Math.floor(start_page_index);
      if (start_page_index < 0) {
        start_page_index = 0;
      }
    }

    var first_page = 0;
    var last_page = max_pages - 1;

    var content = '<center><h1>';
    if (start_page_index > first_page) {
      content += '<a href="' + get_server_address() + '/?page_index=';
      content += first_page; + '">';
      if (first_page == page_index) {
        content += '<span style="color:red;">' + first_page + '</span>';
      } else {
        content += '<span style="color:blue;">' + first_page + '</span>';
      }
      content += '</a>';
      content += '&nbsp;...&nbsp;';
    }

    for (var i = start_page_index; i <= end_page_index; ++i) {
      content += '<a href="' + get_server_address() + '/?page_index=' + i;
      content += '">';
      if (i == page_index) {
        content += '<span style="color:red;">' + i + '</span>';
      } else {
        content += '<span style="color:blue;">' + i + '</span>';
      }
      content += '</a>';
      content += '&nbsp;';
    }

    if (end_page_index < last_page) {
      content += '...&nbsp;';
      content += '<a href="' + get_server_address() + '/?page_index=';
      content += last_page + '">';
      if (last_page == page_index) {
        content += '<span style="color:red;">' + last_page + '</span>';
      } else {
        content += '<span style="color:blue;">' + last_page + '</span>';
      }
      content += '</a>';
    }
    content += '</h1></center>';

    return content;
  }
};