# tpb-proxy-resolver

This is a browser extension which adds a toolbar button for opening a working proxy to the pirate bay. Currently supported on Google Chrome and Firefox. 

The list of proxies is scraped from https://proxybay.github.io/. The proxy with the smallest number in the speed column is used. 

The extension automatically builds and maintains a banlist of proxies. Given that ISPs can ban proxies, they may work for others and not you. If a timeout of 5 seconds is experienced while attempting to access a proxy, it will automatically be added to the banlist and will be ignored the next time the action button is clicked. 

# Installing 

The newest release can be added to chrome from the chrome webstore.

https://chrome.google.com/webstore/detail/tpb-proxy-resolver/oofmceblpnfocgeifnjpanoaakiggcge

# Installing a Release from source

If you wish to install a past version, or a new release which has not passed review yet, follow these steps.

1. Download a zip of the source from the releases page here: https://github.com/Cruuncher/tpb-proxy-resolver/releases
2. Extract the folder tpb-proxy-resolver-[VERSION NUM] onto your computer 
3. Visit chrome://extensions and turn on developer mode. 
4. Click "Load unpacked" and select the extracted folder. This will install the extension.


