App = {
  web3Provider: null,
  contracts: {},
  companies =  {},
  market =  [],

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
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

  initContract: function() {
    $.getJSON('TradingEmissions.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.TradingEmissions = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.TradingEmissions.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.updateMarket();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-buy', App.buy);
    $(document).on('click', '.btn-sell', App.sell);
   // $(document).on('click', '.btn-update', App.updateMarket);
  },

  // TODO: add register company, remove company 

  updateMarket: function() {
        App.contracts.TradingEmissions.deployed().then(function(instance) {
          emInstance = instance;
    
          for (i = 0; i < market.length; i++) {          
              var seller = market[i];            
              var emus = emInstance.getEmus(seller.address, {from: account})
              marketEmus += emus;             
            }
          }
        $('marketEmus').text('Market = ' + marketEmus); 
        console.log("updated market to =  " + marketEmus); 
        }).catch(function(err) {
          console.log(err.message);
        });
      },


  sell: function(account, enumsToSell) {    
        var emInstance;
    
        App.contracts.TradingEmissions.deployed().then(function(instance) {
           emInstance = instance;    
           emInstance.putEmusOnSale(enumsToSell, {from: account});
           console.log("put " + enumsToSell + " on sale");

           var company = companies[account];
           console.log("put " + company + " on market");
           company.enumsToSell = enumsToSell;
           market.push(company)
           updateMarket();
          }
        }).catch(function(err) {
          console.log(err.message);
        });
      },


  buy: function(account, emusToBuy) {
    var emInstance;

    App.contracts.TradingEmissions.deployed().then(function(instance) {
      emInstance = instance;

      var i = 0;
      while(emusToBuy > 0){          
        var seller = market[i++];
        
        if(seller !== undefined  && seller.address !== '0x0000000000000000000000000000000000000000' && seller.emus > 0) {
          var emus = seller.emus;
          emInstance.buyEmus(seller.address, emus, {from: account});
          console.log("bought " + emus + " from " + seller);
          emusToBuy -= emus;
        }
      }
      updateMarket();
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getAccount(event) {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      console.log("got accounts = " + accounts)
      return account;
    }
  }

$(function() {
  $(window).load(function() {
    App.init();
  });
});
