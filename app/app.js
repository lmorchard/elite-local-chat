var os = require('os');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var csv = require('csv');
var gui = require('nw.gui');
var win = gui.Window.get();

// TODO: Need per-user settings
var DEBUG = true;
var SERVER_URL = 'http://localhost:31173';
var LOGS_PATH = getUserHome() + "/AppData/Local/Frontier_Developments/" +
  "Products/FORC-FDEV-D-1010/Logs";

var chatFrame = document.querySelector('iframe[name=chat]');
chatFrame.setAttribute('src', SERVER_URL);

// Start checking for log changes periodically.
setInterval(scanLogs, 3000);

// Accept commands from chat frame
window.addEventListener('message', function (ev) {
  var msg = JSON.parse(ev.data);
  if ('scanLogs' == msg.op) { scanLogs(); }
}, false);

function scanLogs () {
  // Scan files in the logs file
  fs.readdir(LOGS_PATH, function (err, files) {
    if (err) { return; }

    // Find the most recently modified netLog.* file
    var latest = files.map(function (fn) {
      var fn = path.join(LOGS_PATH, fn);
      return [fn, fs.statSync(fn)];
    }).filter(function (item) {
      return item[1].isFile() && item[0].indexOf('netLog.') !== -1;
    }).sort(function (a, b) {
      return b[1].mtime.getTime() - a[1].mtime.getTime();
    })[0][0];

    scrapeNetLog(latest);
  });
}

var RE_SYSTEM = /System:(\d+)\(([^\)]+)\) /;
var RE_NAME = /FindBestIsland:([^:]+):/;

var currSystem, currName;

function scrapeNetLog (latest) {
  // Read the netLog file
  fs.readFile(latest, function (err, data) {
    if (err) { return; }

    // Split into lines, reverse them so the latest is first
    var lines = data.toString().split("\n");
    lines.reverse();

    // Find the most recent FindBestIsland: line, extract CMDR name
    var name = RE_NAME.exec(firstMatch(lines, 'FindBestIsland:'))[1];
    if (name != currName) {
      currName = name;
      chat_postMessage({op: 'updateName', name: name});
    }

    // Find the most recent System: line, extract system name
    var system = RE_SYSTEM.exec(firstMatch(lines, 'System:'))[2];
    if (system != currSystem) {
      currSystem = system;
      chat_postMessage({op: 'updateSystem', system: system});
    }

  });
}

function firstMatch (lines, term) {
  return lines.filter(function (line) {
    return line.indexOf(term) !== -1
  })[0];
}

function chat_postMessage (msg) {
  chatFrame.contentWindow.postMessage(JSON.stringify(msg), '*');
}

function getUserHome() {
  return process.env[(process.platform == 'win32') ?
    'USERPROFILE' : 'HOME'];
}
