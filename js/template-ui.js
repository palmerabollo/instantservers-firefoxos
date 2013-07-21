'use strict';

const UI = (function() {
  var username;
  var password; // TODO move to async_storage

  navigator.mozL10n.ready(function localize() {
    // Do nothing rigth now
  });

  var ENDPOINTS = [
    "api-eu-mad-1.instantservers.telefonica.com",
    "api-eu-lon-1.instantservers.telefonica.com"
  ];

  var startButton = document.querySelector('#start');
  startButton.addEventListener('click', function(e) {
    
    username = document.querySelector('#username').value;
    password = document.querySelector('#password').value;

    getMachines(ENDPOINTS[0], function(result) {
      if (result) {
        var machinesView = document.querySelector('#machines-view');
        machinesView.dataset.pagePosition = 'viewport'; // vs 'bottom'

        var machines = JSON.parse(result);
        var machinesList = document.querySelector('#machines');
        machines.forEach(function(machine) {
          machinesList.innerHTML += '<li><a href="#"><p>' + machine.name + '</p>' +
            '<p>' + machine.primaryIp + ' [' + machine.state + ']</p></a></li>';
        });
      }
    });
  });

  var getMachines = function(endpoint, callback) {
    var endpoint = 'https://' + endpoint + '/my/machines';

    var xhr = new XMLHttpRequest({
      mozSystem: true
    });

    xhr.open('GET', endpoint, true, username, password);

    xhr.timeout = 5000;

    xhr.setRequestHeader('X-Api-Version', '~6.5');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        callback(this.responseText)
      } else if (xhr.status === 401) {
        alert("Wrong username or password.")
        callback(null);
      } else {
        alert("Not able to get your machines. Try again in a minute.");
        callback(null);
      }
    }; // onload

    xhr.ontimeout = function() {
      alert("Not able to get your machines (timeout). Try again in a minute.");
      callback(null);
    }; // ontimeout

    xhr.onerror = function() {
      alert("Not able to get your machines. An error occurred.");
      callback(null);
    }; // onerror

    xhr.send();
  };
}());
