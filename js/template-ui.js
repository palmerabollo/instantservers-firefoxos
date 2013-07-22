'use strict';

const UI = (function() {
  navigator.mozL10n.ready(function localize() {
    // Do nothing rigth now
  });

  var X_API_VERSION_HEADER = '~6.5';

  var ENDPOINTS = {
    'Madrid': 'https://api-eu-mad-1.instantservers.telefonica.com',
    'London': 'https://api-eu-lon-1.instantservers.telefonica.com'
  };

  var MACHINES = {};

  var refresh = function(e) {
    document.querySelector('#start').disabled = true;
    document.querySelector('#start').innerHTML = 'Loading...'; // i18n

    var username = document.querySelector('#username').value;
    var password = document.querySelector('#password').value;

    Object.keys(ENDPOINTS).forEach(function(key) {
      document.querySelector('#total-' + key).innerHTML = "...";
      document.querySelector('#machines-' + key).innerHTML = "";

      getMachines(ENDPOINTS[key], username, password, function(err, result) {
        if (err) {
          document.querySelector('#start').disabled = false;
          document.querySelector('#start').innerHTML = 'Login'; // i18n

          alert(err);
        } else {
          var machinesView = document.querySelector('#machines-view');
          machinesView.dataset.pagePosition = 'viewport'; // vs 'bottom'

          MACHINES[key] = JSON.parse(result); // save globally

          var machinesList = document.querySelector('#machines-' + key);
          MACHINES[key].forEach(function(machine) {
            addListItem(key, machine, machinesList);
          });

          document.querySelector('#total-' + key).innerHTML = '(' + MACHINES[key].length + ')';
        }
      });
    });
  };

  function addEventHandlers() {
    var startButton = document.getElementById('start');
    startButton.addEventListener('click', refresh);
    var refreshButton = document.getElementById('refresh');
    refreshButton.addEventListener('click', refresh);
  }

  addEventHandlers();

  var addListItem = function(datacenterName, machine, machinesList) {
    // TODO use proper template engine
    machinesList.innerHTML += '' +
      '<li>' +
      '<a href="#" id="' + machine.id + '">' +
      '<p>' + 
      (machine.state === 'running' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      machine.name + 
      '</p>' +
      '<p>' + machine.primaryIp + ' - ' + (machine.memory / 1024) + 'GB - ' + machine.type + '</p>' + 
      '</a>' +
      '</li>';

    var item = document.getElementById(machine.id);
    item.addEventListener('click', function(e) {
      alert('Datacenter: ' + datacenter + '<br />' +
        'Name: ' + machine.name + '<br />' +
        'Type: ' + machine.type + '<br />' +
        'State: ' + machine.state + '<br />' +
        'Dataset: ' + machine.dataset + '<br />' +
        'Memory: ' + machine.memory + '<br />' +
        'Disk: ' + machine.disk + '<br />' +
        'IP: ' + machine.primaryIp + '<br />' +
        'Creation: ' + machine.created + '<br />'
      );
    });
  }

  var getMachines = function(endpoint, username, password, callback) {
    var endpoint = endpoint + '/my/machines';

    var xhr = new XMLHttpRequest({
      mozSystem: true
    });

    xhr.open('GET', endpoint, true, username, password);

    xhr.timeout = 45000;

    xhr.setRequestHeader('X-Api-Version', X_API_VERSION_HEADER);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        callback(null, this.responseText)
      } else if (xhr.status === 401) {
        callback("Wrong username or password.");
      } else {
        callback("Not able to get your machines. Please try again.");
      }
    };

    xhr.ontimeout = function() {
      callback("Not able to get your machines (timeout). Try again in a minute.");
    };

    xhr.onerror = function() {
      callback("Not able to get your machines. An error occurred.");
    };

    xhr.send();
  };
}());
