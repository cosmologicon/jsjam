# Subclass of http.server that also handles one particular case of response 206.
# Chrome will not let you rewind audio files unless you are able to serve the audio file with
# response 206 (partial response) rather than 200, even if the entire file is being requested.
# This overrides the behavior for partial requests only when the entire file is being requested to
# send code 206, and also include the Content-Range header, which is required.

# To use: python3 server.py

# References:
# http://stackoverflow.com/questions/9755168/why-does-firebug-show-a-206-partial-content-response-on-a-video-loading-reques
# http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35
# https://code.google.com/p/chromium/issues/detail?id=74576

import http.server, os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
	def send_response(self, code, message=None):
		if self.headers.get("Range") == "bytes=0-" and code == 200:
			code = 206
		http.server.SimpleHTTPRequestHandler.send_response(self, code, message)
		if code == 206:
			clen = os.path.getsize(self.translate_path(self.path))
			self.send_header("Content-Range", "bytes 0-%s/%s" % (clen - 1, clen))

if __name__ == '__main__':
    http.server.test(HandlerClass=MyHTTPRequestHandler)

