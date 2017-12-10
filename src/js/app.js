//noinspection JSAnnotator
App = {
    web3Provider: null,
    contracts: {},
    market:[],
    mEmus: 0,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        // Is there is an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fallback to the TestRPC
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        }
        web3 = new Web3(App.web3Provider);
        return App.initContract();
    },

    initContract: function () {
        $.getJSON('tradingEmissions.json', function (data) {
            console.log(data);
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var contr = data;
            App.contracts.TradingEmissions = TruffleContract(contr);

            // Set the provider for our contract
            App.contracts.TradingEmissions.setProvider(App.web3Provider);
        });
        return App.bindEvents();
    },

    addToMarket: function (address) {
        if(App.market[address] == undefined) {
            App.market.push(address);
            console.log("added " + address + " to market");
        } else {
            console.log(address + " already in market");
        }
    },

    bindEvents: function () {
        $(document).on('click', '#btn-buy', App.buy);
        $(document).on('click', '#btn-sell', App.sell);
    },

    updateMarket: function () {
        var account = App.getAccount();
        App.contracts.TradingEmissions.deployed().then(function (instance) {
                console.log(instance.contract);
                emInstance = instance.contract;

                for (var i = 0; i < App.market.length; i++) {
                    var sellerAccount = App.market[i];
                    console.log("seller = " + sellerAccount);
                    if(sellerAccount !== undefined ) { // && sellerAccount !== account
                        var emus = emInstance.getEmus({from: account});
                        console.log("emus from contract =  " + emus)
                        mEmus += emus;
                    }
                }
                document.getElementById('marketEmus').innerHTML = mEmus;
                console.log("updated market to =  " + mEmus);
            }
        ).catch(function (err) {
            console.log(err.message);
        });
    },

    // Sell Emus from the market
    sell: function () {
        App.getAccount(function(account) {
            console.log("acc = " + account);
            var emusToSell = document.getElementById('form-sell').value;
            var emInstance;

            App.contracts.TradingEmissions.deployed().then(function (instance) {
                console.log("instance addr = " + instance.address);
                emInstance = instance;
                emInstance.putEmusOnSale(emusToSell, {from:account});

                console.log(account + " put " + emusToSell + " on sale");

                var events = emInstance.allEvents();
                
                // watch for changes
                events.watch(function(error, event){
                    console.log(event);
                });            
        
                App.updateMarketWhenMined(emusToSell, function(err, data) {
                    App.addToMarket(account);
                });             

            }).catch(function (err) {
                console.log(err.message);
            });
        });
    },

    setMarketEmus: function(emusToAdd) {
        var emus = document.getElementById('marketEmus').innerHTML;
        var res = parseInt(emus) + parseInt(emusToAdd);
        document.getElementById('marketEmus').innerHTML = res;
        mEmus = res;
        console.log("mEmus = " + mEmus)
    },


    // Buys Emus from the market
    buy : function () {
        App.getAccount(function(account) {   
            console.log("acc = " + account);
            var emusToBuy = document.getElementById('form-buy').value;
            var emInstance;

            App.contracts.TradingEmissions.deployed().then(function (instance) {
        
                emInstance = instance;
                console.log("emusToBuy = " + emusToBuy);
                console.log("mEmus = " + mEmus);

                for(var i = 0; i < App.market.length; i++) {
                    if(mEmus < emusToBuy) {
                        console.log("Not sufficient balance in market");
                        return;
                    }
                    if (emusToBuy > 0) {
                        var seller = App.market[i];
                        console.log("seller = " + seller);
                        if (seller !== undefined && seller !== '0x0000000000000000000000000000000000000000') {    //  && seller !== account   
                                // emusToBuy -= emusOnSale;                          
                                emInstance.buyEmus(seller, emusToBuy, {from: account, value:emusToBuy});

                                console.log(account + " bought " + emusToBuy + " from " + seller);

                                App.updateMarketWhenMined(emusToBuy * -1);            
                            }
                        }
                    }
            }).catch(function (err) {
                console.log(err.message);
            })  
        });
    },


    // Updates market
    updateMarketWhenMined : function(emus, callback) {
        App.setMarketEmus(emus);
        if(callback !== undefined) 
            callback();
    },

    getAccount : function(callback) {
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            console.log("accounts[0] = " + accounts[0]);
            callback(accounts[0]);
        });
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    });
});

