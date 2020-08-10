# Local Video Streaming

Local video streaming is a simple open-source video streaming server using
Node.js / express. Video streaming in your local network (intranet / in-home
network)

## Installation

1. Download and install [Node.js](https://nodejs.org/en/)
2. Clone ["Local Video Streaming" code](https://github.com/rihwan/local_video_streaming)
3. Open shell (or command prompt) and go to cloned directory
4. Install requirements by calling ```npm install```

## Usage

1. Open shell (or command prompt), and go to cloned directory
2. Check your computer IP address (Linux: ifconfig / Windows: ipconfig command)
3. Run server by ```npm start <<<your IP address>>> <<<your port>>> <<<your local video directory>>>```
4. You can find your local videos by accessing ```http://<<<your IP address>>>:<<<your port>>>``` in any devices in your local network.

## Supported Video File Formats

1. MP4
2. MOV
3. WEBM

## License
[MIT](https://github.com/rihwan/local_video_streaming/blob/master/LICENSE)