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
    $('#start').attr('disabled', true);
    $('#start').html('Loading...'); // TODO i18n

    var username = $('#username').val();
    var password = $('#password').val();

    var requestRemoteData = function() {
      Object.keys(ENDPOINTS).forEach(function(key) {
        
        $('#total-vm-' + key).html("...");
        $('#machines-' + key).html("");

        get(ENDPOINTS[key] + '/my/machines', username, password, function(err, result) {
          if (err) {
            handleError(err);
          } else {
            var cloudView = $('#cloud-view');
            cloudView.attr('data-page-position', 'viewport');

            MACHINES[key] = JSON.parse(result); // save globally

            var machinesList = $('#machines-' + key);
            MACHINES[key].forEach(function(machine) {
              addMachineListItem(key, machine, machinesList);
            });

            $('#total-vm-' + key).html('(' + MACHINES[key].length + ')');
          }
        });

        $('#total-net-' + key).html("...");
        $('#networks-' + key).html("");

        get(ENDPOINTS[key] + '/my/networks', username, password, function(err, result) {
          if (err) {
            handleError(err);
          } else {
            var cloudView = $('#cloud-view');
            cloudView.attr('data-page-position', 'viewport');

            NETWORKS[key] = JSON.parse(result); // save globally

            var networksList = $('#networks-' + key);
            NETWORKS[key].forEach(function(network) {
              addNetworkListItem(key, network, networksList);
            });

            $('#total-net-' + key).html('(' + NETWORKS[key].length + ')');
          }
        });
      });
    };

    requestRemoteData();
  };

  var handleError = function(err) {
    $('#start').attr('disabled', false);
    $('#start').html('Login'); // TODO i18n

    alert(err);
  }

  function addEventHandlers() {
    var startButton = $('#start');
    startButton.on('click', refresh);

    var refreshButton = $('#refresh');

    var panel1 = $('#panel1');
    var panel2 = $('#panel2');

    panel1.click(function() {
      panel1.addClass('active');
      panel2.removeClass('active');
    });

    panel2.click(function() {
      panel2.addClass('active');
      panel1.removeClass('active');
    });

    var activateOfflineMode = function() {
      $('#start').hide();
      $('#refresh').attr('aria-disabled', 'true').off('click');
      $('.status').show();
    }

    var activateOnlineMode = function() {
      $('#start').show();
      $('#refresh').attr('aria-disabled', '').on('click', refresh);
      $('.status').hide();
    }

    window.addEventListener("offline", activateOfflineMode);

    window.addEventListener("online", activateOnlineMode);

    if (!navigator.onLine) {
      activateOfflineMode();
    } else {
      activateOnlineMode();
    }
  }

  addEventHandlers();

  var addMachineListItem = function(datacenterName, machine, machinesList) {
    // TODO use proper template engine
    machinesList.append(
      '<li>' +
      '<a class="machine" href="#" id="' + machine.id + '">' +
      '<p>' + 
      (machine.state === 'running' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      machine.name + 
      '</p>' +
      '<p>' + machine.primaryIp + ' - ' + (machine.memory / 1024) + 'GB - ' + machine.type + '</p>' + 
      '</a>' +
      '</li>');
  }

  var addNetworkListItem = function(datacenterName, network, networksList) {
    // TODO use proper template engine
    networksList.append(
      '<li>' +
      '<a class="network" href="#" id="' + network.id + '">' +
      '<p>' + 
      (network.status === 'created' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      network.name + 
      '</p>' +
      '<p>' + network.subnet + ' - IP: ' + network.public_gw_ip + '</p>' + 
      '</a>' +
      '</li>');
  }

  $(document).on("click", "a.network", function(e) {
    var selectedElementId = this.id;

    Object.keys(NETWORKS).forEach(function(key) {
      NETWORKS[key].forEach(function(network) {
        if (network.id == selectedElementId) {
          alert('Name: ' + network.name + '\r\n\r\n' +
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
          alert('Name: ' + machine.name + '\r\n\r\n' +
            'Type: ' + machine.type + '\r\n' +
            machine.dataset + '\r\n\r\n' +
            'State: ' + machine.state + '\r\n' +
            'Memory: ' + machine.memory + ' MB\r\n' +
            'Disk: ' + machine.disk + ' MB\r\n' +
            'IP: ' + machine.primaryIp + '\r\n'
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

    xhr.timeout = 90000;

    xhr.setRequestHeader('X-Api-Version', X_API_VERSION_HEADER);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 0) {
        callback(null, this.responseText)
      } else if (xhr.status === 401) {
        callback('Wrong username or password.');
      } else {
        callback('Not able to get your data. Please try again.');
      }
    };

    xhr.ontimeout = function() {
      callback('Not able to get your data (timeout). Try again in a minute.');
    };

    xhr.onerror = function() {
      callback('Not able to get your data. An unexpected error occurred.');
    };

    xhr.send();
  };

}());
