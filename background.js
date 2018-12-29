function banProxyURL(url) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({"banned_urls": []}, function(items) {
            banned_urls = items['banned_urls'];
            banned_urls.push(url);
            console.log("new banned urls: " + banned_urls)
            chrome.storage.local.set({"banned_urls": banned_urls}, resolve);
        });
    });
}

function unbanURL(url) {
    chrome.storage.local.get({"banned_urls": []}, function(items) {
        banned_urls = items['banned_urls'];
        new_banned_urls = []; 
        for(var i = 0 ; i < banned_urls.length ; i++) {
            if(banned_urls[i] !== url) {
                new_banned_urls.push(banned_urls[i])
            }
        }
        chrome.storage.local.set({"banned_urls": new_banned_urls});
    });
}

function clearSaved() {
    chrome.storage.local.remove(["saved_url", "saved_url_time"]);
}

function setSavedURL(url) {
    console.log("setting save url: " + url)
    now = new Date().getTime();
    chrome.storage.local.set({
        "saved_url": url,
        "saved_url_time": now
    });
}

async function advanceToTPB(url) {
    chrome.tabs.create({
        url: url
    });

    try {
        await checkProxyURL(url);
        setSavedURL(url);
    } catch(error) {
        console.log("Could not load proxy(" + url + "). Error: " + error)
        await banProxyURL(fastestProxy);
        withStorage(quietLookup);
    }
}

function withStorage(callback) {
    chrome.storage.local.get({
        'banned_urls': [],
        'saved_url': "",
        "saved_url_time": 0
    }, callback)
}

function resolveBySaved(storage) {
    savedUrl = storage['saved_url'];
    savedUrlTime = storage['saved_url_time'];
    banned = storage['banned_urls'];
    now = new Date().getTime();
    if(((now - savedUrlTime) < 360000) && (banned.indexOf(savedUrl) === -1)) {
        console.log("resolved url from saved_url: " + savedUrl);
        advanceToTPB(savedUrl);
        return true;
    } 
    return false;
} 

async function resolveByLookup(storage) {
    banlist = storage['banned_urls'];

    proxyBayDoc = await proxyBay();
    fastestProxy = fastestProxyInDocument(proxyBayDoc, banlist);
    advanceToTPB(fastestProxy);
}

function promiseRequest(url, timeout=5000) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.timeout = timeout;
        xhr.responseType = "document"
        xhr.onload = () => resolve(xhr.responseXML);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    }) 
}

function checkProxyURL(url) {
    return promiseRequest(url);
}

function proxyBay() {
    return promiseRequest('https://proxybay.github.io/');
}

async function quietLookup(storage) {
    banlist = storage['banned_urls'];

    proxyBayDoc = await proxyBay();
    fastestProxy = fastestProxyInDocument(proxyBayDoc, banlist);

    try {
        await checkProxyURL(fastestProxy);
        setSavedURL(fastestProxy);
    } catch(error) {
        console.log("Could not load proxy(" + fastestProxy + "). Error: " + error)
        await banProxyURL(fastestProxy);
        withStorage(quietLookup);
    }
}

function fastestProxyInDocument(doc, banlist) {
    proxyList = doc.getElementById('proxyList').rows;
    fastestTime = 999999;
    fastestProxy = "";
    for(var i = 1 ; i < proxyList.length ; i++) {
        theRow = proxyList[i];
        speed = theRow.getElementsByClassName('speed')[0].innerText 
        if(speed === 'N/A') {
            continue;
        }

        proxyUrl = theRow.cells[0].getElementsByTagName('a')[0].href;

        if(banlist.indexOf(proxyUrl) !== -1) {
            console.log("skipping banned proxy: " + proxyUrl);
            continue;
        }

        if(speed < fastestTime) {
            fastestTime = speed;
            fastestProxy = proxyUrl
        }
    }

    if(!fastestProxy) {
        throw "no_working_proxy";
    }

    return fastestProxy;
}

async function resolveProxy(storage) {
    if(!resolveBySaved(storage)) {
        resolveByLookup(storage);
    }
}

chrome.browserAction.onClicked.addListener(function(tab) {
    withStorage(resolveProxy);
});

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        parts = msg.split("$$");
        if(parts[0] === "unbanURL") {
            unbanURL(parts[1]);
        } else if(parts[0] === "clearSaved") {
            clearSaved();
        } else if(parts[0] === "banURL") {
            banProxyURL(parts[1]);
        }
    });
});

withStorage(quietLookup);
