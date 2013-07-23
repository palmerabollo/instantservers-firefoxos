'use strict';

const UI = (function() {
  var X_API_VERSION_HEADER = '~6.5';

  var ENDPOINTS = {
    'Madrid': 'https://api-eu-mad-1.instantservers.telefonica.com',
    'London': 'https://api-eu-lon-1.instantservers.telefonica.com'
  };

  var MACHINES = {};
  var NETWORKS = {};

  var refresh = function() {
    document.querySelector('#start').disabled = true;
    document.querySelector('#start').innerHTML = 'Loading...'; // i18n

    var username = document.querySelector('#username').value;
    var password = document.querySelector('#password').value;

    Object.keys(ENDPOINTS).forEach(function(key) {
      
      document.querySelector('#total-vm-' + key).innerHTML = "...";
      document.querySelector('#machines-' + key).innerHTML = "";

      get(ENDPOINTS[key] + '/my/machines', username, password, function(err, result) {
        if (err) {
          handleError(err);
        } else {
          var cloudView = document.querySelector('#cloud-view');
          cloudView.dataset.pagePosition = 'viewport'; // vs 'bottom'

          MACHINES[key] = JSON.parse(result); // save globally

          var machinesList = document.querySelector('#machines-' + key);
          MACHINES[key].forEach(function(machine) {
            addMachineListItem(key, machine, machinesList);
          });

          document.querySelector('#total-vm-' + key).innerHTML = '(' + MACHINES[key].length + ')';
        }
      });

      document.querySelector('#total-net-' + key).innerHTML = "...";
      document.querySelector('#networks-' + key).innerHTML = "";

      get(ENDPOINTS[key] + '/my/networks', username, password, function(err, result) {
        if (err) {
          handleError(err);
        } else {
          var cloudView = document.querySelector('#cloud-view');
          cloudView.dataset.pagePosition = 'viewport'; // vs 'bottom'

          NETWORKS[key] = JSON.parse(result); // save globally

          var networksList = document.querySelector('#networks-' + key);
          NETWORKS[key].forEach(function(network) {
            addNetworkListItem(key, network, networksList);
          });

          document.querySelector('#total-net-' + key).innerHTML = '(' + NETWORKS[key].length + ')';
        }
      });
    });
  };

  var handleError = function(err) {
    document.querySelector('#start').disabled = false;
    document.querySelector('#start').innerHTML = 'Login'; // i18n

    alert(err);
  }

  function addEventHandlers() {
    var startButton = document.getElementById('start');
    startButton.addEventListener('click', refresh);

    var refreshButton = document.getElementById('refresh');
    refreshButton.addEventListener('click', refresh);

    var panel1 = document.getElementById('panel1');
    var panel2 = document.getElementById('panel2');

    panel1.addEventListener('click', function() {
      panel1.classList.add('active');
      panel2.classList.remove('active');
    });

    panel2.addEventListener('click', function() {
      panel2.classList.add('active');
      panel1.classList.remove('active');
    });
  }

  addEventHandlers();

  var addMachineListItem = function(datacenterName, machine, machinesList) {
    // TODO use proper template engine
    machinesList.innerHTML += '' +
      '<li>' +
      '<a class="machine" href="#" id="' + machine.id + '">' +
      '<p>' + 
      (machine.state === 'running' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      machine.name + 
      '</p>' +
      '<p>' + machine.primaryIp + ' - ' + (machine.memory / 1024) + 'GB - ' + machine.type + '</p>' + 
      '</a>' +
      '</li>';
  }

  var addNetworkListItem = function(datacenterName, network, networksList) {
    // TODO use proper template engine
    networksList.innerHTML += '' +
      '<li>' +
      '<a class="network" href="#" id="' + network.id + '">' +
      '<p>' + 
      (network.status === 'created' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      network.name + 
      '</p>' +
      '<p>' + network.subnet + ' - IP: ' + network.public_gw_ip + '</p>' + 
      '</a>' +
      '</li>';
  }

  $(document).on("click", "a.network", function(e) {
    var selectedElementId = this.id;

    Object.keys(NETWORKS).forEach(function(key) {
      NETWORKS[key].forEach(function(network) {
        if (network.id == selectedElementId) {
          alert('Name: ' + network.name + '\r\n' +
            'Subnet: ' + network.subnet + '\r\n' +
            'Private GW: ' + network.private_gw_ip + '\r\n' +
            'Public GW: ' + network.public_gw_ip + '\r\n' +
            'Status: ' + network.status + '\r\n'
          );
        }
      });
    });
  });

  $(document).on("click", "a.machine", function(e) {
    var selectedElementId = this.id;

    Object.keys(MACHINES).forEach(function(key) {
      MACHINES[key].forEach(function(machine) {
        if (machine.id == selectedElementId) {
          alert('Name: ' + machine.name + '\r\n' +
            'Type: ' + machine.type + '\r\n' +
            'State: ' + machine.state + '\r\n' +
            'Dataset: ' + machine.dataset + '\r\n' +
            'Memory: ' + machine.memory + '\r\n' +
            'Disk: ' + machine.disk + '\r\n' +
            'IP: ' + machine.primaryIp + '\r\n' +
            'Creation: ' + machine.created + '\r\n'
          );
        }
      });
    });
  });

  var get = function(endpoint, username, password, callback) {
    var xhr = new XMLHttpRequest({
      mozSystem: true
    });

    xhr.open('GET', endpoint, true, username, password);

    xhr.timeout = 60000;

    xhr.setRequestHeader('X-Api-Version', X_API_VERSION_HEADER);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        callback(null, this.responseText)
      } else if (xhr.status === 401) {
        callback("Wrong username or password.");
      } else {
        callback("Not able to get your data. Please try again.");
      }
    };

    xhr.ontimeout = function() {
      callback("Not able to get your data (timeout). Try again in a minute.");
    };

    xhr.onerror = function() {
      callback("Not able to get your data. An error occurred.");
    };

    xhr.send();
  };
}());
