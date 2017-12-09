//noinspection JSAnnotator
App = {
    web3Provider: null,
    contracts: {},
    companies: {},
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
            App.account = App.getAccount();

            App.addToCompanies(App.account);
            // Use our contract to retrieve and mark the adopted pets
            return App.updateMarket();
        });
        return App.bindEvents();
    },

    addToCompanies: function (company) {
        App.companies.push(company);
        console.log("added " + company + " to companies");
    },

    addToMarket: function (company) {
        App.market.push(company);
        console.log("added " + company + " to market");
    },

    bindEvents: function () {
        $(document).on('click', '#btn-buy', App.buy);
        $(document).on('click', '#btn-sell', App.sell);
        // $(document).on('click', '.btn-update', App.updateMarket);
    },

    // TODO: add register company, remove company
    updateMarket: function () {
        App.contracts.TradingEmissions.deployed().then(function (instance) {
                emInstance = instance;

                for (var i = 0; i < App.market.length; i++) {
                    var seller = App.market[i];
                    var emus = emInstance.getEmus(seller.address, {from: App.account});
                    App.marketEmus += emus;
                }
                //$('marketEmus').text('Market = ' + marketEmus);
                console.log("updated market to =  " + App.marketEmus);
            }
        ).catch(function (err) {
            console.log(err.message);
        });
    },

    sell: function () {
        var emusToSell = document.getElementById('form-sell').value;
        console.log("sell " + App.account + " , " + emusToSell);
        var emInstance;

        App.contracts.TradingEmissions.deployed().then(function (instance) {
            emInstance = instance;
            emInstance.putEmusOnSale(emusToSell, {from: App.account});
            console.log("put enums " + emusToSell + " on sale");

            var company = App.companies[App.account];
           // company.enumsToSell = emusToSell;

            App.addToMarket(company);
            App.updateMarket();

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
                    if (seller !== undefined && seller.address !== '0x0000000000000000000000000000000000000000' && seller.emus > 0) {
                        var emus = seller.emus;
                        emInstance.buyEmus(seller.address, emus, {from: App.account});
                        console.log("bought " + emus + " from " + seller);
                        emusToBuy -= emus;
                    }
                }
            }
            App.updateMarket();
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    getAccount : function() {
        var account = undefined;
        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.log(error);
            }
            account = accounts[0];
            console.log("got accounts = " + accounts);

        });
        return account;
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});

