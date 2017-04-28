

'use strict;'

// application
var app = {
    isLoading: true,
    packageList: [],
    localPackageList: [],
    spinner: document.querySelector('.loader'),
    listContainer: document.querySelector('.packageList'),
    detailContainer: document.querySelector('.packageDetail'),
    offlineType: document.querySelector('.offlineType')
};

// event listener's when click refresh
document.getElementById('btnRefresh').addEventListener('click', function() {
    app.getAllPackages();
});

// get all packages if have net from server else from local storage
app.getAllPackages = function() {
    if (navigator.onLine) {
        console.log("[getAllPackages] from server");
        app.getAllPackagesFromServer();
    } else {
        console.log("[getAllPackages] from local");
        app.getAllPackagesFromLocal();
    }
}

// get all packages from Server
app.getAllPackagesFromServer = function() {
    var requestUrl = 'js/data.json';
    
    // TODO add cache logic here
    if ('caches' in window) {
      /*
       * Check if the service worker has already cached data.
       * If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */
        caches.match(requestUrl).then(function(response) {
            if (response) {
                response.json().then(function loadFromCache(itemsInCache) {
                    packageList = itemsInCache;
                    app.showAllPackages();
                });
            }
        });
    }
    
    var client = new HttpClient();
    client.get(requestUrl, function(response) {
        if (response && response.length > 0) {
            // server send data
            packageList = JSON.parse(response); 
            app.saveLocalPackageList();
        } else {
            // server send NO data try local
            packageList = [];
            app.getAllPackagesFromLocal();
        }
        app.showAllPackages();
    });
};

// get package list from local storage
app.getAllPackagesFromLocal = function() {
    if (localStorage.localPackageList) {
        packageList = JSON.parse(localStorage.localPackageList);
        app.showAllPackages();
    }
};

// get a package by id
app.getPackage = function(id) {
    for (i = 0; i < packageList.length; i++) {
        var package = packageList[i];
        if (package.id == id) {
            return package;
        }
    }
};

// save packages list in local storage
app.saveLocalPackageList = function() {
    var packages = JSON.stringify(packageList);
    localStorage.localPackageList = packages;
};

// display all packages in view
app.showAllPackages = function() {
    app.clearView();
    app.showSpinner();
    var html = "";
    for (i = 0; i < packageList.length; i++) {
        var package = packageList[i];
        html += app.getMiniPackageHtml(package);
    }
    app.hideSpinner();
    app.listContainer.innerHTML = html;
    scrollTop();
};

// click package details
var clickShowPackage = function(id) {
    app.clearView();
    app.showSpinner();
    var package = app.getPackage(id);
    app.hideSpinner();
    app.detailContainer.innerHTML = app.getPackageHtml(package);
    scrollTop();
};

// package html summary
app.getMiniPackageHtml = function(package) {
    var html = "";
    if (package) {
        html = '<div class="miniPackageTemplate shadow" onclick="clickShowPackage(' + "'" + package.id + "'" + ')">'
        html += '<img src="' + package.img + '" alt="' + package.name + '" class="img-responsive">';
        html += '<h5>' + package.name + '</h5>';
        html += '<div class="packageDate text-info">' + package.date + '</div>';
        html += '</div>';
    }
    return html;
};

// package html detail
app.getPackageHtml = function(package) {
    var html = "";
    if (package) {
        html = '<div class="packageTemplate shadow">'
        html += '<img src="' + package.img + '" alt="' + package.name + '" class="img-responsive">';
        html += '<h4>' + package.name + '</h4>';
        html += '<div><strong>' + package.id + '</strong></div>';
        html += '<div class="packageDescription"><p>' + package.description + '</p></div>';
        if (package.includedServices) {
            html += '<h5>Serviços Incluidos</h5>';
            html += '<div class="includedServices">' + package.includedServices + '</div><br>'
        }
        html += '<div class="packageDate text-info">' + package.date + '</div>';
        html += '<div class="packagePrice text-danger text-right"><strong>' + Number(package.price).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,') + ' €</strong></div>';
        html += '<div class="clearFloats"></div>';
        html += '</div>';
    }
    return html;
};

app.showTitle = function(cacheType) {
    var msg = "Offline mode: ";
    if (cacheType == 'applicationCache') {
        app.offlineType.innerHTML = msg + "Application Cache";
    } else if (cacheType == 'serviceWorker') {
        app.offlineType.innerHTML = msg + "Service Worker";
    } else {
        app.offlineType.innerHTML = "Offline disabled, no support for Service Workers nor for Application Cache";
    }
};

// show spinner
app.showSpinner = function() {
    app.spinner.setAttribute('hidden', false);
    app.isLoading = true;
};

// hide spinner
app.hideSpinner = function() {
    app.spinner.setAttribute('hidden', true);
    app.isLoading = false;
};

// clear view's html
app.clearView = function() {
    app.listContainer.innerHTML = "";
    app.detailContainer.innerHTML = "";
    app.showSpinner();
};

// Http client async
var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }
        // set false for synchronous request, synchronous requests are discouraged
        // use true for asynchronous  
        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
};

// move win to top
var scrollTop = function() {
    window.scrollTo(0, 0);
};

// app start
app.getAllPackages();

// verificar se o navegador oferece suporte a service workers e, em caso positivo, registrar o service worker
if ('serviceWorker' in navigator) {
    app.showTitle('serviceWorker');
    navigator.serviceWorker
        .register('/teste/service-worker.js')
        .then(function() {
            console.log('Service Worker Registered');
        }).catch(function(err) {
            console.log('Service Worker Registration Failed: ', err);
        });
} else if ('applicationCache' in window) {
    app.showTitle('applicationCache');
    var appCache = window.applicationCache;
    appCache.addEventListener('updateready', function(e) {
        if (appCache.status == window.applicationCache.UPDATEREADY) {
            // Browser downloaded a new app cache. Swap it in and reload the page to get the new hotness.
            appCache.swapCache();
            window.location.reload();
        }
    }, false);
    console.log('Using Application Cache');
} else {
    app.showTitle('none');
    console.log('No support for Service Workers nor for Application Cache');
}


