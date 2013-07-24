'use strict';

const UI = (function() {
  var X_API_VERSION_HEADER = '~6.5';

  var CLOUD_API_ENDPOINT = 'https://api-eu-mad-1.instantservers.telefonica.com';
  var ENDPOINTS = {};
  var ELEMENTS = {};

  var authenticate = function() {
    $('#start').attr('disabled', true);
    $('#start').html('Loading...'); // TODO i18n

    var username = $('#username').val();
    var password = $('#password').val();

    var promise = get(CLOUD_API_ENDPOINT + '/my/datacenters', username, password);
    $.when(promise)
      .done(function(data, textStatus, xhr) {
        ENDPOINTS = data;
        showDashboard();
      })
      .fail(function(xhr) {
        if (xhr.status === 401) {
          handleError("Wrong username or password");
        } else {
          handleError("Not able to authenticate. Try again in a minute.");
        }
      })
      .always(function() {
        $('#start').attr('disabled', false);
        $('#start').html('Login'); // TODO i18n
      });
  }

  var refreshDashboard = function() {
    $('#refresh').attr('aria-disabled', 'true').off('click');

    var username = $('#username').val();
    var password = $('#password').val();
    
    var promises = [];

    Object.keys(ENDPOINTS).forEach(function(datacenter) {        
      $('#total-machines-' + datacenter).html("...");
      $('#machines-' + datacenter).html("");
      var machinesPromise = get(ENDPOINTS[datacenter] + '/my/machines', username, password);
      machinesPromise
        .done(function(data, textStatus, xhr) {
          renderMachinesList(data, datacenter);
        })
        .fail(function(xhr) {
          if (xhr.status === 401) {
            logout();
          } else {
            handleError('Not able to get your virtual machines in ' + datacenter);
          }
        });
      promises.push(machinesPromise);

      $('#total-networks-' + datacenter).html("...");
      $('#networks-' + datacenter).html("");
      var networksPromise = get(ENDPOINTS[datacenter] + '/my/networks', username, password);
      networksPromise
        .done(function(data, textStatus, xhr) {
          renderNetworksList(data, datacenter);
        })
        .fail(function(xhr) {
          if (xhr.status === 401) {
            logout();
          } else {
            handleError('Not able to get your virtual machines in ' + datacenter);
          }
        });
      promises.push(networksPromise);
    });

    $.when(promises).always(function() {
      $('#refresh').attr('aria-disabled', '').on('click', refreshDashboard);
    });
  };

  var handleError = function(message) {
    alert(message);
  }

  var logout = function() {
    $("#password").val("");
    hideDashboard();
  }

  function addEventHandlers() {
    var startButton = $('#start');
    startButton.on('click', authenticate);

    var panel1 = $('#panel1');
    var panel2 = $('#panel2');

    panel1.click(function() {
      panel1.addClass('active');
      panel2.removeClass('active');
    });

    panel2.click(function() {
      panel1.removeClass('active');
      panel2.addClass('active');      
    });

    var activateOfflineMode = function() {
      $('#start').hide();
      $('#refresh').attr('aria-disabled', 'true').off('click');
      $('.status').show();
    }

    var activateOnlineMode = function() {
      $('#start').show();
      $('#refresh').attr('aria-disabled', '').on('click', refreshDashboard);
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

  var showDashboard = function() {
    var cloudView = $('#cloud-view');
    cloudView.attr('data-page-position', 'viewport');

    refreshDashboard();
  }

  var hideDashboard = function() {
    var cloudView = $('#cloud-view');
    cloudView.attr('data-page-position', 'bottom');
  }

  var renderMachinesList = function(machines, datacenter) {
    var machinesList = $('#machines-' + datacenter);
    machines.forEach(function(item) {
      item.toHTML = function() {
        return 'Name: ' + this.name + '\r\n\r\n' +
          'Type: ' + this.type + '\r\n' +
          this.dataset + '\r\n\r\n' +
          'State: ' + this.state + '\r\n' +
          'Memory: ' + (this.memory / 1024) + ' GB\r\n' +
          'Disk: ' + (this.disk / 1024) + ' GB\r\n' +
          'IP: ' + this.primaryIp;
      };
      putCache(item);

      addMachineListItem(item, machinesList);
    });

    $('#total-machines-' + datacenter).html('(' + machines.length + ')');
  }

  var renderNetworksList = function(networks, datacenter) {
    var networksList = $('#networks-' + datacenter);
    networks.forEach(function(item) {
      item.toHTML = function() {
        return 'Name: ' + this.name + '\r\n\r\n' +
          'Subnet: ' + this.subnet + '\r\n' +
          'Private GW: ' + this.private_gw_ip + '\r\n' +
          'Public GW: ' + this.public_gw_ip + '\r\n' +
          'State: ' + this.status;
      };
      putCache(item);

      addNetworkListItem(item, networksList);
    });

    $('#total-networks-' + datacenter).html('(' + networks.length + ')');
  }

  var putCache = function(element) {
    ELEMENTS[element.id] = element;
  }

  var getCache = function(id) {
    return ELEMENTS[id];
  }

  var addMachineListItem = function(machine, list) {
    // TODO use proper template engine
    list.append(
      '<li>' +
      '<a class="element" href="#" id="' + machine.id + '">' +
      '<p>' + 
      (machine.state === 'running' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      machine.name + 
      '</p>' +
      '<p>' + machine.primaryIp + ' - ' + (machine.memory / 1024) + 'GB - ' + machine.type + '</p>' + 
      '</a>' +
      '</li>');
  }

  var addNetworkListItem = function(network, list) {
    // TODO use proper template engine
    list.append(
      '<li>' +
      '<a class="element" href="#" id="' + network.id + '">' +
      '<p>' + 
      (network.status === 'created' ? '<img src="./res/green.gif">' : '<img src="./res/red.gif">') + '&nbsp;' +
      network.name + 
      '</p>' +
      '<p>' + network.subnet + ' - IP: ' + network.public_gw_ip + '</p>' + 
      '</a>' +
      '</li>');
  }

  $(document).on("click", "a.element", function(e) {
    var element = getCache(this.id);
    alert(element.toHTML());
  });

  var get = function(endpoint, username, password) {
    return $.ajax(
      endpoint,
      {
        xhr: function() {
          var xhr = new XMLHttpRequest({
            mozSystem: true,
            // XXX hack, a bug in firefox os prompts for user/pass if you omit this flag
            // https://bugzilla.mozilla.org/show_bug.cgi?id=282547#c24
            // https://bugzilla.mozilla.org/show_bug.cgi?id=282547#c26
            mozAnon: true
          });
          xhr.open('GET', endpoint, true);
          xhr.timeout = 40000;
          xhr.setRequestHeader('Accept', 'application/json');
          return xhr;
        },
        beforeSend: function(xhr) {
          xhr.setRequestHeader('X-Api-Version', X_API_VERSION_HEADER);
          xhr.setRequestHeader('Accept', 'application/json'); // XXX

          var authorization = "Basic " + btoa(username + ':' + password);
          xhr.setRequestHeader('Authorization', authorization);
        },
        dataType: "json"
      }
    );
  };
}());
