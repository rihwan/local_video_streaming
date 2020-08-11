# Local Video Streaming

Local video streaming is a simple open-source video streaming server using
Node.js / express. This server allows video streaming server in your local
network (intranet / in-home network).

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
4. Run server by
   - ```npm start <<<IP address>>> <<<port>>> <<<local video directory>>>```
5. You can find your local videos by accessing ```http://<<<IP address>>>:<<<port>>>``` in any devices in your local network.

## Supported Video File Formats

1. MP4
2. MOV
3. WEBM

## License
[MIT](https://github.com/rihwan/local_video_streaming/blob/master/LICENSE)