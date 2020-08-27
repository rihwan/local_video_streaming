# Local Video Streaming

Local video streaming is a simple open-source video streaming server using
Node.js / express / UIkit. This server allows video streaming server in your
local network (intranet / in-home network).

## Installation

1. Download and install [Node.js](https://nodejs.org/en/)
2. Clone [Local Video Streaming Code](https://github.com/rihwan/local_video_streaming)
3. Open a terminal (Linux) or a command prompt (Windows)
4. Go to the cloned directory
5. Install requirements by calling ```npm install```

## Usage

1. Open a terminal (Linux) or command prompt (Windows)
2. Go to the cloned directory
3. Check your computer's IP address and choose your own port
   - Find your computer's IP address using
     - ```ifconfig``` (Linux) or ```ipconfig``` (Windows)
   - Choose your own port (e.g., 3000)
4. Create your own config.json file
   - Copy config_template.json file, and change the content (server ip, port, local video directory, etc).
4. Run server by
   - ```npm start <<<Your config file>>>```
5. Access your local streaming webpage in any devices in your local network
   - ```http://<<<IP address>>>:<<<port>>>```

## How to create screenshots

0. Python3 is needed as a pre-requisite.
1. Install ffmpeg (ffmpeg should be added in PATH)
2. Open a terminal (Linux) or command prompt (Windows)
3. Go to ```tools``` directory under the cloned directory
4. Run the recursive screen capture script
   - ```python recursively_capture_screenshot.py <<<local video directory>>>```
   - This will take some time depending on the number of videos in the given directory.

## Supported Video File Formats

1. MP4
2. MOV
3. WEBM

## License
[MIT](https://github.com/rihwan/local_video_streaming/blob/master/LICENSE)

This project is completely free of charge, use, copy, merge, publish and
distribute without any limitations.
