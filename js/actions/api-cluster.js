/* jshint strict: false, unused: false */
/* global AQL_EXECUTE, ArangoServerState, ArangoClusterComm, ArangoClusterInfo, ArangoAgency */

// //////////////////////////////////////////////////////////////////////////////
// / @brief cluster actions
// /
// / @file
// /
// / DISCLAIMER
// /
// / Copyright 2014 ArangoDB GmbH, Cologne, Germany
// /
// / Licensed under the Apache License, Version 2.0 (the "License")
// / you may not use this file except in compliance with the License.
// / You may obtain a copy of the License at
// /
// /     http://www.apache.org/licenses/LICENSE-2.0
// /
// / Unless required by applicable law or agreed to in writing, software
// / distributed under the License is distributed on an "AS IS" BASIS,
// / WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// / See the License for the specific language governing permissions and
// / limitations under the License.
// /
// / Copyright holder is ArangoDB GmbH, Cologne, Germany
// /
// / @author Max Neunhoeffer
// / @author Copyright 2014, ArangoDB GmbH, Cologne, Germany
// / @author Copyright 2014, ArangoDB GmbH, Cologne, Germany
// / @author Copyright 2013-2014, triAGENS GmbH, Cologne, Germany
// //////////////////////////////////////////////////////////////////////////////

var actions = require('@arangodb/actions');
var cluster = require('@arangodb/cluster');
// var internal = require('internal');
var _ = require('lodash');

var fetchKey = cluster.fetchKey;

actions.defineHttp({
  url: '_admin/cluster/removeServer',
  allowUseDatabase: true,
  prefix: false,

  callback: function (req, res) {
    if (req.requestType !== actions.POST ||
      !require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only DELETE requests are allowed and only to coordinators');
      return;
    }

    let serverId;
    try {
      serverId = JSON.parse(req.requestBody);
    } catch (e) {
    }

    if (typeof serverId !== 'string') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'required parameter ServerID was not given');
      return;
    }

    let agency = ArangoAgency.get('', false, true).arango;

    let node = agency.Supervision.Health[serverId];
    if (node === undefined) {
      actions.resultError(req, res, actions.HTTP_NOT_FOUND,
        'unknown server id');
      return;
    }

    if (serverId.substr(0, 4) !== 'CRDN' && serverId.substr(0, 4) !== 'PRMR') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'couldn\'t determine role for serverid ' + serverId);
      return;
    }

    let preconditions = {};
    preconditions['/arango/Supervision/Health/' + serverId + '/Status'] = {'old': 'FAILED'};
    // need to make sure it is not responsible for anything
    if (node.Role === 'DBServer') {
      let used = [];
      preconditions = reducePlanServers(function (data, agencyKey, servers) {
        data[agencyKey] = {'old': servers};
        if (servers.indexOf(serverId) !== -1) {
          used.push(agencyKey);
        }
        return data;
      }, {});
      preconditions = reduceCurrentServers(function (data, agencyKey, servers) {
        data[agencyKey] = {'old': servers};
        if (servers.indexOf(serverId) !== -1) {
          used.push(agencyKey);
        }
        return data;
      }, preconditions);

      if (used.length > 0) {
        actions.resultError(req, res, actions.HTTP_PRECONDITION_FAILED,
          'the server is still in use at the following locations: ' + JSON.stringify(used));
        return;
      }
    }

    let operations = {};
    operations['/arango/Plan/Coordinators/' + serverId] = {'op': 'delete'};
    operations['/arango/Plan/DBServers/' + serverId] = {'op': 'delete'};
    operations['/arango/Current/ServersRegistered/' + serverId] = {'op': 'delete'};
    operations['/arango/Supervision/Health/' + serverId] = {'op': 'delete'};
    operations['/arango/Target/MapUniqueToShortID/' + serverId] = {'op': 'delete'};

    try {
      global.ArangoAgency.write([[operations, preconditions]]);
    } catch (e) {
      if (e.code === 412) {
        actions.resultError(req, res, actions.HTTP_PRECONDITION_FAILED,
          'you can only remove failed servers');
        return;
      }
      throw e;
    }

    actions.resultOk(req, res, actions.HTTP_OK, true);
    /* DBOnly:

    Current/Databases/YYY/XXX
    */
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @brief was docuBlock JSF_cluster_node_version_GET
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/clusterNodeVersion',
  prefix: false,

  callback: function (req, res) {
    if (req.requestType !== actions.GET) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only GET requests are allowed');
      return;
    }

    let serverId;
    try {
      if (req.parameters.ServerID) {
        serverId = req.parameters.ServerID;
      }
    } catch (e) {
    }

    if (typeof serverId !== 'string' || serverId.length === 0) {
      actions.resultError(req, res, actions.HTTP_BAD,
        'required parameter ServerID was not given');
      return;
    }

    var options = { timeout: 10 };
    var op = ArangoClusterComm.asyncRequest('GET', 'server:' + serverId, req.database,
      '/_api/version', '', {}, options);
    var r = ArangoClusterComm.wait(op);
    res.contentType = 'application/json; charset=utf-8';
    if (r.status === 'RECEIVED') {
      res.responseCode = actions.HTTP_OK;
      res.body = r.body;
    } else if (r.status === 'TIMEOUT') {
      res.responseCode = actions.HTTP_BAD;
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'operation timed out'
      });
    } else {
      res.responseCode = actions.HTTP_BAD;
      var bodyobj;
      try {
        bodyobj = JSON.parse(r.body);
      } catch (err) {}
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'error from Server, possibly Server unknown',
        'body': bodyobj
      });
    }
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @brief was docuBlock JSF_cluster_node_stats_GET
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/clusterNodeStats',
  prefix: false,

  callback: function (req, res) {
    if (req.requestType !== actions.GET) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only GET requests are allowed');
      return;
    }

    let serverId;
    try {
      if (req.parameters.ServerID) {
        serverId = req.parameters.ServerID;
      }
    } catch (e) {
    }

    if (typeof serverId !== 'string') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'required parameter ServerID was not given');
      return;
    }

    var options = { timeout: 10 };
    var op = ArangoClusterComm.asyncRequest('GET', 'server:' + serverId, req.database,
      '/_admin/statistics', '', {}, options);
    var r = ArangoClusterComm.wait(op);
    res.contentType = 'application/json; charset=utf-8';
    if (r.status === 'RECEIVED') {
      res.responseCode = actions.HTTP_OK;
      res.body = r.body;
    } else if (r.status === 'TIMEOUT') {
      res.responseCode = actions.HTTP_BAD;
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'operation timed out'
      });
    } else {
      res.responseCode = actions.HTTP_BAD;
      var bodyobj;
      try {
        bodyobj = JSON.parse(r.body);
      } catch (err) {}
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'error from Server, possibly Server unknown',
        'body': bodyobj
      });
    }
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @brief was docuBlock JSF_cluster_node_engine_GET
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/clusterNodeEngine',
  prefix: false,

  callback: function (req, res) {
    if (req.requestType !== actions.GET) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only GET requests are allowed');
      return;
    }

    let serverId;
    try {
      if (req.parameters.ServerID) {
        serverId = req.parameters.ServerID;
      }
    } catch (e) {
    }

    if (typeof serverId !== 'string') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'required parameter ServerID was not given');
      return;
    }

    var options = { timeout: 10 };
    var op = ArangoClusterComm.asyncRequest('GET', 'server:' + serverId, req.database,
      '/_api/engine', '', {}, options);
    var r = ArangoClusterComm.wait(op);
    res.contentType = 'application/json; charset=utf-8';
    if (r.status === 'RECEIVED') {
      res.responseCode = actions.HTTP_OK;
      res.body = r.body;
    } else if (r.status === 'TIMEOUT') {
      res.responseCode = actions.HTTP_BAD;
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'operation timed out'
      });
    } else {
      res.responseCode = actions.HTTP_BAD;
      var bodyobj;
      try {
        bodyobj = JSON.parse(r.body);
      } catch (err) {}
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'error from Server, possibly Server unknown',
        'body': bodyobj
      });
    }
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @brief was docuBlock JSF_cluster_statistics_GET
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/clusterStatistics',
  prefix: false,

  callback: function (req, res) {
    if (req.requestType !== actions.GET) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only GET requests are allowed');
      return;
    }
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only allowed on coordinator');
      return;
    }
    if (!req.parameters.hasOwnProperty('DBserver')) {
      actions.resultError(req, res, actions.HTTP_BAD,
        'required parameter DBserver was not given');
      return;
    }
    var DBserver = req.parameters.DBserver;
    var options = { timeout: 10 };
    var op = ArangoClusterComm.asyncRequest('GET', 'server:' + DBserver, req.database,
      '/_admin/statistics', '', {}, options);
    var r = ArangoClusterComm.wait(op);
    res.contentType = 'application/json; charset=utf-8';
    if (r.status === 'RECEIVED') {
      res.responseCode = actions.HTTP_OK;
      res.body = r.body;
    } else if (r.status === 'TIMEOUT') {
      res.responseCode = actions.HTTP_BAD;
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'operation timed out'
      });
    } else {
      res.responseCode = actions.HTTP_BAD;
      var bodyobj;
      try {
        bodyobj = JSON.parse(r.body);
      } catch (err) {}
      res.body = JSON.stringify({
        'error': true,
        'errorMessage': 'error from DBserver, possibly DBserver unknown',
        'body': bodyobj
      });
    }
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @brief was docuBlock JSF_cluster_statistics_GET
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/health',
  allowUseDatabase: true,
  prefix: false,

  callback: function (req, res) {
    let role = global.ArangoServerState.role();
    if (req.requestType !== actions.GET ||
        (role !== 'COORDINATOR' && role !== 'SINGLE')) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only GET requests are allowed and only to coordinators or singles');
      return;
    }

    /* remove? timeout not used
    var timeout = 60.0;
    try {
      if (req.parameters.hasOwnProperty('timeout')) {
        timeout = Number(req.parameters.timeout);
      }
    } catch (e) {}
    */

    var clusterId;
    try {
      clusterId = ArangoAgency.get('Cluster', false, true).arango.Cluster;
    } catch (e1) {
      actions.resultError(req, res, actions.HTTP_NOT_FOUND, 0,
        'Failed to retrieve clusterId node from agency!');
      return;
    }

    let agency = ArangoAgency.agency();

    var Health;
    try {
      Health = ArangoAgency.get('Supervision/Health', false, true).arango.Supervision.Health;
    } catch (e1) {
      actions.resultError(req, res, actions.HTTP_NOT_FOUND, 0,
        'Failed to retrieve supervision node from agency!');
      return;
    }

    Health = Object.entries(Health).reduce((Health, [serverId, struct]) => {
      let canBeDeleted = false;
      if (serverId.startsWith('PRMR')) {
        Health[serverId].Role = 'DBServer';
      } else if (serverId.startsWith('CRDN')) {
        Health[serverId].Role = 'Coordinator';
      }
      if (struct.Role === 'Coordinator') {
        canBeDeleted = struct.Status === 'FAILED';
      } else if (struct.Role === 'DBServer') {
        if (struct.Status === 'FAILED') {
          let numUsed = reducePlanServers(function (numUsed, agencyKey, servers) {
            if (servers.indexOf(serverId) !== -1) {
              numUsed++;
            }
            return numUsed;
          }, 0);
          if (numUsed === 0) {
            numUsed = reduceCurrentServers(function (numUsed, agencyKey, servers) {
              if (servers.indexOf(serverId) !== -1) {
                numUsed++;
              }
              return numUsed;
            }, 0);
          }
          canBeDeleted = numUsed === 0;
        }
      }
      // the structure is all uppercase for whatever reason so make it uppercase as well
      Health[serverId].CanBeDeleted = canBeDeleted;
      return Health;
    }, Health);

    Object.entries(agency[0]['.agency'].pool).forEach(([key, value]) => {
      Health[key] = {Endpoint: value, Role: 'Agent', CanBeDeleted: false};
    });

    actions.resultOk(req, res, actions.HTTP_OK, {Health, ClusterId: clusterId});
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @brief allows to query the historic statistics of a DBserver in the cluster
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/history',
  prefix: false,

  callback: function (req, res) {
    if (req.requestType !== actions.POST) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only POST requests are allowed');
      return;
    }
    var body = actions.getJsonBody(req, res);
    if (body === undefined) {
      return;
    }
    var DBserver = req.parameters.DBserver;

    // build query
    var figures = body.figures;
    var filterString = ' filter u.time > @startDate';
    var bind = {
      startDate: (new Date().getTime() / 1000) - 20 * 60
    };

    if (cluster.isCoordinator() && !req.parameters.hasOwnProperty('DBserver')) {
      filterString += ' filter u.clusterId == @serverId';
      bind.serverId = cluster.coordinatorId();
    }

    var returnValue = ' return u';
    if (figures) {
      returnValue = ' return { time : u.time, server : {uptime : u.server.uptime} ';

      var groups = {};
      figures.forEach(function (f) {
        var g = f.split('.')[0];
        if (!groups[g]) {
          groups[g] = [];
        }
        groups[g].push(f.split('.')[1] + ' : u.' + f);
      });
      Object.keys(groups).forEach(function (key) {
        returnValue += ', ' + key + ' : {' + groups[key] + '}';
      });
      returnValue += '}';
    }
    // allow at most ((60 / 10) * 20) * 2 documents to prevent total chaos
    var myQueryVal = 'FOR u in _statistics ' + filterString + ' LIMIT 240 SORT u.time' + returnValue;

    if (!req.parameters.hasOwnProperty('DBserver')) {
      // query the local statistics collection
      var cursor = AQL_EXECUTE(myQueryVal, bind);
      res.contentType = 'application/json; charset=utf-8';
      if (cursor instanceof Error) {
        res.responseCode = actions.HTTP_BAD;
        res.body = JSON.stringify({
          'error': true,
          'errorMessage': 'an error occurred'
        });
      }
      res.responseCode = actions.HTTP_OK;
      res.body = JSON.stringify({result: cursor.docs});
    } else {
      // query a remote statistics collection
      var options = { timeout: 10 };
      var op = ArangoClusterComm.asyncRequest('POST', 'server:' + DBserver, req.database,
        '/_api/cursor', JSON.stringify({query: myQueryVal, bindVars: bind}), {}, options);
      var r = ArangoClusterComm.wait(op);
      res.contentType = 'application/json; charset=utf-8';
      if (r.status === 'RECEIVED') {
        res.responseCode = actions.HTTP_OK;
        res.body = r.body;
      } else if (r.status === 'TIMEOUT') {
        res.responseCode = actions.HTTP_BAD;
        res.body = JSON.stringify({
          'error': true,
          'errorMessage': 'operation timed out'
        });
      } else {
        res.responseCode = actions.HTTP_BAD;
        var bodyobj;
        try {
          bodyobj = JSON.parse(r.body);
        } catch (err) {}
        res.body = JSON.stringify({
          'error': true,
          'errorMessage': 'error from DBserver, possibly DBserver unknown',
          'body': bodyobj
        });
      }
    }
  }
});

function reducePlanServers (reducer, data) {
  var databases = ArangoAgency.get('Plan/Collections');
  databases = databases.arango.Plan.Collections;

  return Object.keys(databases).reduce(function (data, databaseName) {
    var collections = databases[databaseName];

    return Object.keys(collections).reduce(function (data, collectionKey) {
      var collection = collections[collectionKey];

      return Object.keys(collection.shards).reduce(function (data, shardKey) {
        var servers = collection.shards[shardKey];

        let key = '/arango/Plan/Collections/' + databaseName + '/' + collectionKey + '/shards/' + shardKey;
        return reducer(data, key, servers);
      }, data);
    }, data);
  }, data);
}

function reduceCurrentServers (reducer, data) {
  var databases = ArangoAgency.get('Current/Collections');
  databases = databases.arango.Current.Collections;

  return Object.keys(databases).reduce(function (data, databaseName) {
    var collections = databases[databaseName];

    return Object.keys(collections).reduce(function (data, collectionKey) {
      var collection = collections[collectionKey];

      return Object.keys(collection).reduce(function (data, shardKey) {
        var servers = collection[shardKey].servers;

        let key = '/arango/Current/Collections/' + databaseName + '/' + collectionKey + '/' + shardKey + '/servers';
        return reducer(data, key, servers);
      }, data);
    }, data);
  }, data);
}

// //////////////////////////////////////////////////////////////////////////////
// / @brief changes responsibility for all shards from oldServer to newServer.
// / This needs to be done atomically!
// //////////////////////////////////////////////////////////////////////////////

function changeAllShardReponsibilities (oldServer, newServer) {
  return reducePlanServers(function (data, key, servers) {
    var oldServers = _.cloneDeep(servers);
    servers = servers.map(function (server) {
      if (server === oldServer) {
        return newServer;
      } else {
        return server;
      }
    });
    data.operations[key] = servers;
    data.preconditions[key] = {'old': oldServers};
    return data;
  }, {
    operations: {},
    preconditions: {}
  });
}

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_getNumberOfServers
// / (intentionally not in manual)
// / @brief gets the number of coordinators desired, which are stored in
// / /Target/NumberOfDBServers in the agency.
// /
// / @ RESTHEADER{GET /_admin/cluster/numberOfServers, Get desired number of coordinators and DBServers.}
// /
// / @ RESTQUERYPARAMETERS
// /
// / @ RESTDESCRIPTION gets the number of coordinators and DBServers desired,
// / which are stored in `/Target` in the agency. A body of the form
// /     { "numberOfCoordinators": 12, "numberOfDBServers": 12 }
// / is returned. Note that both value can be `null` indicating that the
// / cluster cannot be scaled.
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{200} is returned when everything went well.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not GET
// / or PUT.
// /
// / @ RESTRETURNCODE{503} the get operation did not work.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_putNumberOfServers
// / (intentionally not in manual)
// / @brief sets the number of coordinators and or DBServers desired, which
// / are stored in /Target in the agency.
// /
// / @ RESTHEADER{PUT /_admin/cluster/numberOfServers, Set desired number of coordinators and or DBServers.}
// /
// / @ RESTQUERYPARAMETERS
// /
// / @ RESTDESCRIPTION sets the number of coordinators and DBServers desired,
// / which are stored in `/Target` in the agency. A body of the form
// /     { "numberOfCoordinators": 12, "numberOfDBServers": 12,
// /       "cleanedServers": [] }
// / must be supplied. Either one of the values can be left out and will
// / then not be changed. Either numeric value can be `null` to indicate
// / that the cluster cannot be scaled.
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{200} is returned when everything went well.
// /
// / @ RESTRETURNCODE{400} body is not valid JSON.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not GET
// / or PUT.
// /
// / @ RESTRETURNCODE{503} the agency operation did not work.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/numberOfServers',
  allowUseDatabase: false,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.GET &&
      req.requestType !== actions.PUT) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only GET and PUT methods are allowed');
      return;
    }

    // Now get to work:
    if (req.requestType === actions.GET) {
      var nrCoordinators;
      var nrDBServers;
      var cleanedServers;
      try {
        nrCoordinators = ArangoAgency.get('Target/NumberOfCoordinators');
        nrCoordinators = nrCoordinators.arango.Target.NumberOfCoordinators;
        nrDBServers = ArangoAgency.get('Target/NumberOfDBServers');
        nrDBServers = nrDBServers.arango.Target.NumberOfDBServers;
        cleanedServers = ArangoAgency.get('Target/CleanedServers');
        cleanedServers = cleanedServers.arango.Target.CleanedServers;
      } catch (e1) {
        actions.resultError(req, res, actions.HTTP_SERVICE_UNAVAILABLE,
          'Cannot read from agency.');
        return;
      }
      actions.resultOk(req, res, actions.HTTP_OK, {
        numberOfCoordinators: nrCoordinators,
        numberOfDBServers: nrDBServers,
        cleanedServers
      });
    } else { // PUT
      var body = actions.getJsonBody(req, res);
      if (body === undefined) {
        return;
      }
      if (typeof body !== 'object') {
        actions.resultError(req, res, actions.HTTP_BAD,
          'body must be an object');
        return;
      }
      var ok = true;
      try {
        if (body.hasOwnProperty('numberOfCoordinators') &&
          (typeof body.numberOfCoordinators === 'number' ||
          body.numberOfCoordinators === null)) {
          ArangoAgency.set('Target/NumberOfCoordinators',
            body.numberOfCoordinators);
        }
      } catch (e1) {
        ok = false;
      }
      try {
        if (body.hasOwnProperty('numberOfDBServers') &&
          (typeof body.numberOfDBServers === 'number' ||
          body.numberOfDBServers === null)) {
          ArangoAgency.set('Target/NumberOfDBServers',
            body.numberOfDBServers);
        }
      } catch (e2) {
        ok = false;
      }
      try {
        if (body.hasOwnProperty('cleanedServers') &&
          typeof body.cleanedServers === 'object' &&
          Array.isArray(body.cleanedServers)) {
          ArangoAgency.set('Target/CleanedServers',
            body.cleanedServers);
        }
      } catch (e3) {
        ok = false;
      }
      if (!ok) {
        actions.resultError(req, res, actions.HTTP_SERVICE_UNAVAILABLE,
          'Cannot write to agency.');
        return;
      }
      actions.resultOk(req, res, actions.HTTP_OK, true);
    }
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_postCleanOutServer
// / (intentionally not in manual)
// / @brief triggers activities to clean out a DBServer
// /
// / @ RESTHEADER{POST /_admin/cluster/cleanOutServer, Trigger activities to clean out a DBServers.}
// /
// / @ RESTQUERYPARAMETERS
// /
// / @ RESTDESCRIPTION Triggers activities to clean out a DBServer.
// / The body must be a JSON object with attribute "server" that is a string
// / with the ID of the server to be cleaned out.
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{202} is returned when everything went well and the
// / job is scheduled.
// /
// / @ RESTRETURNCODE{400} body is not valid JSON.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not POST.
// /
// / @ RESTRETURNCODE{503} the agency operation did not work.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/cleanOutServer',
  allowUseDatabase: false,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.POST) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only the POST method is allowed');
      return;
    }

    // Now get to work:
    var body = actions.getJsonBody(req, res);
    if (body === undefined) {
      return;
    }
    if (typeof body !== 'object' ||
      !body.hasOwnProperty('server') ||
      typeof body.server !== 'string') {
      actions.resultError(req, res, actions.HTTP_BAD,
        "body must be an object with a string attribute 'server'");
      return;
    }

    // First translate the server name from short name to long name:
    var server = body.server;
    var servers = global.ArangoClusterInfo.getDBServers();
    for (let i = 0; i < servers.length; i++) {
      if (servers[i].serverId !== server) {
        if (servers[i].serverName === server) {
          server = servers[i].serverId;
          break;
        }
      }
    }

    var ok = true;
    var id;
    try {
      id = ArangoClusterInfo.uniqid();
      var todo = {
        'type': 'cleanOutServer',
        'server': server,
        'jobId': id,
        'timeCreated': (new Date()).toISOString(),
        'creator': ArangoServerState.id()
      };
      ArangoAgency.set('Target/ToDo/' + id, todo);
    } catch (e1) {
      ok = false;
    }
    if (!ok) {
      actions.resultError(req, res, actions.HTTP_SERVICE_UNAVAILABLE,
        {error: true, errorMsg: 'Cannot write to agency.'});
      return;
    }
    actions.resultOk(req, res, actions.HTTP_ACCEPTED, {error: false, id: id});
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_postMoveShard
// / (intentionally not in manual)
// / @brief triggers activities to move a shard
// /
// / @ RESTHEADER{POST /_admin/cluster/moveShard, Trigger activities to move a shard.}
// /
// / @ RESTQUERYPARAMETERS
// /
// / @ RESTDESCRIPTION Triggers activities to move a shard.
// / The body must be a JSON document with the following attributes:
// /   - `"database"`: a string with the name of the database
// /   - `"collection"`: a string with the name of the collection
// /   - `"shard"`: a string with the name of the shard to move
// /   - `"fromServer"`: a string with the ID of a server that is currently
// /     the leader or a follower for this shard
// /   - `"toServer"`: a string with the ID of a server that is currently
// /     not the leader and not a follower for this shard
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{202} is returned when everything went well and the
// / job is scheduled.
// /
// / @ RESTRETURNCODE{400} body is not valid JSON.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not POST.
// /
// / @ RESTRETURNCODE{503} the agency operation did not work.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/moveShard',
  allowUseDatabase: false,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.POST) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only the POST method is allowed');
      return;
    }

    // Now get to work:
    var body = actions.getJsonBody(req, res);
    if (body === undefined) {
      return;
    }
    if (typeof body !== 'object' ||
      !body.hasOwnProperty('database') ||
      typeof body.database !== 'string' ||
      !body.hasOwnProperty('collection') ||
      typeof body.collection !== 'string' ||
      !body.hasOwnProperty('shard') ||
      typeof body.shard !== 'string' ||
      !body.hasOwnProperty('fromServer') ||
      typeof body.fromServer !== 'string' ||
      !body.hasOwnProperty('toServer') ||
      typeof body.toServer !== 'string') {
      actions.resultError(req, res, actions.HTTP_BAD,
        "body must be an object with string attributes 'database', 'collection', 'shard', 'fromServer' and 'toServer'");
      return;
    }
    body.shards = [body.shard];
    body.collections = [body.collection];
    var r = require('@arangodb/cluster').moveShard(body);
    if (r.error) {
      actions.resultError(req, res, actions.HTTP_SERVICE_UNAVAILABLE, r);
      return;
    }
    actions.resultOk(req, res, actions.HTTP_ACCEPTED, r);
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_collectionShardDistribution
// / (intentionally not in manual)
// / @brief returns information about all collections and their shard
// / distribution
// /
// / @ RESTHEADER{PUT /_admin/cluster/collectionShardDistribution,
// / Get shard distribution for a specific collections.}
// /
// / @ RESTDESCRIPTION Returns an object with an attribute for a specific collection.
// / The attribute name is the collection name. Each value is an object
// / of the following form:
// /
// /     { "collection1": { "Plan": { "s100001": ["DBServer001", "DBServer002"],
// /                                  "s100002": ["DBServer003", "DBServer004"] },
// /                        "Current": { "s100001": ["DBServer001", "DBServer002"],
// /                                     "s100002": ["DBServer003"] } },
// /       "collection2": ...
// /     }
//
// / The body must be a JSON document with the following attributes:
// /   - `"collection"`: a string with the name of the collection
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{200} is returned when everything went well and the
// / job is scheduled.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not GET.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/collectionShardDistribution',
  allowUseDatabase: false,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.PUT) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only the PUT method is allowed');
      return;
    }

    var body = actions.getJsonBody(req, res);
    if (typeof body !== 'object') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'body must be an object.');
      return;
    }
    if (!body.collection) {
      actions.resultError(req, res, actions.HTTP_BAD,
        'body missing. expected collection name.');
      return;
    }
    if (typeof body.collection !== 'string') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'collection name must be a string.');
      return;
    }

    var result = require('@arangodb/cluster').collectionShardDistribution(body.collection);
    actions.resultOk(req, res, actions.HTTP_OK, result);
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_getShardDistribution
// / (intentionally not in manual)
// / @brief returns information about all collections and their shard
// / distribution
// /
// / @ RESTHEADER{GET /_admin/cluster/shardDistribution, Get shard distribution for all collections.}
// /
// / @ RESTDESCRIPTION Returns an object with an attribute for each collection.
// / The attribute name is the collection name. Each value is an object
// / of the following form:
// /
// /     { "collection1": { "Plan": { "s100001": ["DBServer001", "DBServer002"],
// /                                  "s100002": ["DBServer003", "DBServer004"] },
// /                        "Current": { "s100001": ["DBServer001", "DBServer002"],
// /                                     "s100002": ["DBServer003"] } },
// /       "collection2": ...
// /     }
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{200} is returned when everything went well and the
// / job is scheduled.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not GET.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/shardDistribution',
  allowUseDatabase: false,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.GET) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only the GET method is allowed');
      return;
    }

    var result = require('@arangodb/cluster').shardDistribution();
    actions.resultOk(req, res, actions.HTTP_OK, result);
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_postRebalanceShards
// / (intentionally not in manual)
// / @brief triggers activities to rebalance shards
// /
// / @ RESTHEADER{POST /_admin/cluster/rebalanceShards, Trigger activities to rebalance shards.}
// /
// / @ RESTDESCRIPTION Triggers activities to rebalance shards.
// / The body must be an empty JSON object.
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{202} is returned when everything went well.
// /
// / @ RESTRETURNCODE{400} body is not valid JSON.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not POST.
// /
// / @ RESTRETURNCODE{503} the agency operation did not work.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/rebalanceShards',
  allowUseDatabase: true,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.POST) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only the POST method is allowed');
      return;
    }

    // Now get to work:
    var body = actions.getJsonBody(req, res);
    if (body === undefined) {
      return;
    }
    if (typeof body !== 'object') {
      actions.resultError(req, res, actions.HTTP_BAD,
        'body must be an object.');
      return;
    }
    var ok = require('@arangodb/cluster').rebalanceShards();
    if (!ok) {
      actions.resultError(req, res, actions.HTTP_SERVICE_UNAVAILABLE,
        'Cannot write to agency.');
      return;
    }
    actions.resultOk(req, res, actions.HTTP_ACCEPTED, true);
  }
});

// //////////////////////////////////////////////////////////////////////////////
// / @start Docu Block JSF_getSupervisionState
// / (intentionally not in manual)
// / @brief returns information about the state of Supervision jobs
// /
// / @ RESTHEADER{GET /_admin/cluster/supervisionState, Get information
// / about the state of Supervision jobs.
// /
// / @ RESTDESCRIPTION Returns an object with attributes `ToDo`, `Pending`,
// / `Failed` and `Finished` mirroring the state of Supervision jobs in
// / the agency.
// /
// / @ RESTRETURNCODES
// /
// / @ RESTRETURNCODE{200} is returned when everything went well and the
// / job is scheduled.
// /
// / @ RESTRETURNCODE{403} server is not a coordinator or method was not GET.
// /
// / @end Docu Block
// //////////////////////////////////////////////////////////////////////////////

actions.defineHttp({
  url: '_admin/cluster/supervisionState',
  allowUseDatabase: false,
  prefix: false,

  callback: function (req, res) {
    if (!require('@arangodb/cluster').isCoordinator()) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only coordinators can serve this request');
      return;
    }
    if (req.requestType !== actions.GET) {
      actions.resultError(req, res, actions.HTTP_FORBIDDEN, 0,
        'only the GET method is allowed');
      return;
    }

    var result = require('@arangodb/cluster').supervisionState();
    if (result.error) {
      actions.resultError(req, res, actions.HTTP_BAD, result);
      return;
    }
    actions.resultOk(req, res, actions.HTTP_OK, result);
  }
});
