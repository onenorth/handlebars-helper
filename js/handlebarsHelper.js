/**
 * A component to interface with handlebars templates allowing you to store them
 * serverside insted of inline, increasing re-use potential. Also handles AJAX
 * fetching of said templates, and caches them locally to prevent further
 * fetching from occuring for the same template if reused. Makes life even
 * easier by allowing you to populate any element with a given template and data
 * using just 1 function call. Assumes Handlebars object exists already.
 * @author Jason Mayes
 */

var handlebarsHelper = (function(global) {
  var httpRequest;
  var cachedTemplates = {};
  var busy = false;
  var requestStack = [];
  var currentRequest = {};
  
  function createRequest() {
    if (global.XMLHttpRequest) {
        httpRequest = new XMLHttpRequest();
      } else if (global.ActiveXObject) {
        try {
          httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) {
          try {
            httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
          }
          catch (e) {
          }
        }
  }

  function loadTemplate(req) {
    // Check if URL is already in cache.
    var cacheId = 'id' + req.templateUrl.replace(/^[a-z0-9]+$/i, '');
    
    if (cachedTemplates[cacheId]) {
      document.getElementById(req.id).innerHTML =
          cachedTemplates[cacheId](req.jsonData);
      popStack();
    } else {
        httpRequest = createRequest();
      }

      if (!httpRequest) {
        console.error('ERROR: Unable to create httpRequest');
        return false;
      }
      httpRequest.onreadystatechange = handleResponse;
      httpRequest.open('GET', req.templateUrl);
      httpRequest.send();
    }
  }

  function handleResponse() {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 200) {
        var template = Handlebars.compile(httpRequest.responseText);
        var cacheId = 'id' +
            currentRequest.templateUrl.replace(/^[a-z0-9]+$/i, '');
        cachedTemplates[cacheId] = template;
        document.getElementById(currentRequest.id).innerHTML =
            template(currentRequest.jsonData);
      } else {
        console.error('There was a problem with the request.');
      }
      popStack();
    }

  }

  function popStack() {
    if (requestStack.length > 0) {
      nextRequest = requestStack.shift();
      currentRequest.id = nextRequest.id;
      currentRequest.templateUrl = nextRequest.templateUrl;
      currentRequest.jsonData = nextRequest.jsonData;
      loadTemplate(currentRequest);
    } else {
      busy = false;
    }
  }

  function populateTemplateInternal(id, templateUrl, jsonData) {
    if (!busy) {
      busy = true;
      currentRequest.id = id;
      currentRequest.templateUrl = templateUrl;
      currentRequest.jsonData = jsonData;
      loadTemplate(currentRequest);
    } else {
      requestStack.push({'id': id, 'templateUrl': templateUrl,
          'jsonData': jsonData});
    }
  }

  return {
    populateTemplate: populateTemplateInternal
  }
})(global || window);
