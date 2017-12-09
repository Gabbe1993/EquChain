//noinspection JSAnnotator
App = {
    web3Provider: null,
    contracts: {},
    //companies: {},
    market:[],
    account: 0x0,

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
            account = App.getAccount();

            // App.addToCompanies(account);
            // Use our contract to retrieve and mark the adopted pets
            return App.updateMarket();
        });
        return App.bindEvents();
    },

    addToCompanies: function (company) {
        App.companies.push(company);
        console.log("added " + company + " to companies");
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
        // $(document).on('click', '.btn-update', App.updateMarket);
    },

    // TODO: add register company, remove company
    updateMarket: function () {
        App.contracts.TradingEmissions.deployed().then(function (instance) {
                console.log(instance.contract);
                emInstance = instance.contract;
                var marketEmus = 0;

                for (var i = 0; i < App.market.length; i++) {
                    var sellerAccount = App.market[i];
                    console.log("seller = " + sellerAccount);
                    if(sellerAccount !== undefined) {
                        var emus = emInstance.getEmus({from: account});
                        console.log("emus from contract =  " + emus)
                        marketEmus += emus;
                    }
                }
                document.getElementById('marketEmus').innerHTML = marketEmus;
                console.log("updated market to =  " + marketEmus);
            }
        ).catch(function (err) {
            console.log(err.message);
        });
    },

    sell: function () {
        var emusToSell = document.getElementById('form-sell').value;
        console.log("sell " + account + " , " + emusToSell);
        var emInstance;

        App.contracts.TradingEmissions.deployed().then(function (instance) {
            emInstance = instance;
            emInstance.putEmusOnSale(emusToSell);
            console.log("put enums " + emusToSell + " on sale");
            // console.log(App.companies)
            // var company = App.companies[account];
            // company.enumsToSell = emusToSell;

            App.addToMarket(account);
            var val = document.getElementById('marketEmus').innerHTML;
            document.getElementById('marketEmus').innerHTML = parseInt(val) + parseInt(emusToSell);
            //App.updateMarket();

        }).catch(function (err) {
            console.log(err.message);
        });
    },


    buy: function () {
        var emusToBuy = document.getElementById('form-buy').value;
        console.log("buy " + emusToBuy);
        var emInstance;

        App.contracts.TradingEmissions.deployed().then(function (instance) {
            emInstance = instance;

            for(var i = 0; i < App.market.length; i++) {
                if (emusToBuy > 0) {
                    var seller = App.market[i];
                    console.log("seller = " + seller);
                    if (seller !== undefined && seller !== '0x0000000000000000000000000000000000000000') {                        
                      /*   emInstance.getEmusOnSale(function(err, data) { 
                             if(err) {
                                 console.log("ERROOOOOR " + err);
                             }
                            // TODO: Error: new BigNumber() not a number: function (err, data) 
                            console.log("data = " + data);
                            var emusOnSale = new BigNumber(data);

                            console.log("emusOnSale = " + emusOnSale);                         
                            console.log("buys from " + seller);

                            emInstance.buyEmus(seller, emusOnSale, {from: account, value:web3.toWei('200','wei')});
                            console.log("bought " + emusOnSale + " from " + seller);
                            emusToBuy -= emusOnSale;
                            
                            var val = document.getElementById('marketEmus').innerHTML;
                            document.getElementById('marketEmus').innerHTML = parseInt(val) - emusToBuy; 
                          */
                          emInstance.buyEmus(seller, emusToBuy, {from: account, value:web3.toWei('200','wei')});
                        }
                    }
                }
            console.log("got here");
            App.updateMarket();
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    getAccount : function() {
        return web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            console.log("got accounts = " + accounts[0]);
            return account = accounts[0];
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});

