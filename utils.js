// Utility functions.
let hostname = process.argv[2];
let port = process.argv[3];
let restrict_to_local_ip_address = process.argv[5];

const NUM_FILES_PER_PAGE = 10;
const NUM_PAGES_TO_SHOW = 2;

var get_server_address = function () {
  var address = 'http://' + hostname + ':' + port;
  return address;
};

module.exports = {
  get_server_address: get_server_address,
  check_local_ip_address: function (req) {
    if (restrict_to_local_ip_address) {
      var partial_ip = String(req.ip).substring(7);
      if (String(req.ip).substring(7) !== '192.168') {
        console.log('Outside of local network tried to access: ' + partial_ip);
        return false;
      }

      return true;
    } else {
      return true;
    }
  },
  get_page_numbers_content: function (video_files, page_index) {
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